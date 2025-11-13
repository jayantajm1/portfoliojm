# How to Check if Login Authentication is Working

## Quick Test Methods

### Method 1: Run Existing Authentication Tests (Recommended)

The project already has comprehensive authentication tests in `AuthControllerTests.cs`. Run them to verify authentication:

```powershell
# Run all authentication tests
cd "d:\project NIC\JIT-gitlab\jitapitest\dotnet"
dotnet test --filter "FullyQualifiedName~AuthControllerTests"
```

#### Key Tests:
1. **AuthController_Login_WithFactoryData_CanLogin** - Verifies complete login flow
2. **AuthController_GetCaptchaImage_ReturnsOk** - Tests captcha generation  
3. **AuthController_SendOtp_CanSend** - Tests OTP functionality
4. **AuthController_Logout_CanLogout** - Tests logout

### Method 2: Manual API Testing

#### Step 1: Start the API
```powershell
cd "d:\project NIC\JIT-gitlab\jitapitest\dotnet\JITAPI"
dotnet run
```

#### Step 2: Test Login Endpoint
Use Postman, curl, or the `.http` file:

```http
### Get Login Credentials from Factory (Test Only)
GET https://localhost:7069/Factory/LoginInputModel

### Login
POST https://localhost:7069/api/auth/login
Content-Type: application/json

{
  "Username": "test_user",
  "Password": "Test@123",
  "CaptchaCode": "ABCD",
  "CaptchaId": 1,
  "Fin_Year": 2024
}
```

Expected Response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh_token_here",
    "expiresIn": 3600
  }
}
```

#### Step 3: Test Protected Endpoint with Token
```http
### Access Protected Endpoint
GET https://localhost:7069/api/master/get-all-active-schemes
Authorization: Bearer YOUR_JWT_TOKEN_HERE
```

Expected: Status 200 OK with data

Without token: Status 401 Unauthorized

### Method 3: Use Integration Test

Run the complete authentication flow test:

```powershell
cd "d:\project NIC\JIT-gitlab\jitapitest\dotnet"
dotnet test --filter "Test_Complete_Authentication_Flow" --logger "console;verbosity=detailed"
```

This test will:
1. ✅ Check API is running  
2. ✅ Get test credentials from factory
3. ✅ Attempt login
4. ✅ Verify JWT token is received
5. ✅ Test token works with protected endpoints
6. ✅ Log detailed results to `test-results/` folder

## What to Check

### ✅ Authentication is Working if:
1. Login endpoint returns 200 OK
2. JWT token is present in response
3. Refresh token is present in response
4. Token can access protected endpoints (not 401)
5. Invalid credentials are rejected (401/400)

### ❌ Authentication is NOT Working if:
1. Login endpoint returns 500 Internal Server Error
2. No token in response
3. Token gives 401 on protected endpoints
4. Database connection errors
5. Authentication middleware not configured

## Common Issues & Solutions

### Issue: "Unable to find the required services" (Hangfire)
**Solution**: Hangfire needs database connection in Test environment
- Check `appsettings.Test.json` has `HangfireConnection`
- Verify PostgreSQL database `hangfire` exists
- Disable Hangfire in test environment (already done for Testing environment)

### Issue: "401 Unauthorized" on Login
**Solution**: 
- Check database has user data
- Verify password hashing matches
- Check JWT configuration in `appsettings.json`

### Issue: Token Received but 401 on Protected Endpoints
**Solution**:
- Check JWT validation settings
- Verify token signature algorithm matches
- Check authentication middleware order in `Program.cs`

## Current Test Status

Based on existing tests:
- ✅ **Login endpoint exists** (`/api/auth/login`)
- ✅ **Factory generates test credentials** (`/Factory/LoginInputModel`)
- ✅ **JWT tokens are generated** (TokenModel returned)
- ✅ **Refresh tokens supported**
- ✅ **Protected endpoints require authentication**
- ✅ **Test authentication scheme configured**

## Verification Checklist

Run this checklist to verify authentication:

```bash
# 1. Build project
dotnet build

# 2. Run authentication tests
dotnet test --filter "FullyQualifiedName~AuthControllerTests"

# 3. Check test results in:
#    test-results/YYYY-MM-DD/*.log
```

Expected output:
```
✓ AuthController_Login_WithFactoryData_CanLogin [PASS]
✓ AuthController_GetCaptchaImage_ReturnsOk [PASS]
✓ AuthController_SendOtp_CanSend [PASS]
✓ AuthController_Logout_CanLogout [PASS]
```

## Authentication Flow Diagram

```
1. Client Request
   ↓
2. GET /Factory/LoginInputModel (test only)
   ↓
3. Receive test credentials
   ↓
4. POST /api/auth/login with credentials
   ↓
5. Server validates credentials
   ↓
6. JWT token generated
   ↓
7. Client receives token
   ↓
8. Client sends token in Authorization header
   ↓
9. Server validates token
   ↓
10. Access granted to protected resources
```

## Next Steps

If authentication tests pass:
- ✅ Login is working correctly
- ✅ JWT tokens are valid
- ✅ Protected endpoints are secured
- Ready for frontend integration

If tests fail:
1. Check database connection
2. Verify user exists in database
3. Check JWT configuration
4. Review authentication middleware setup
5. Check test logs in `test-results/` folder
