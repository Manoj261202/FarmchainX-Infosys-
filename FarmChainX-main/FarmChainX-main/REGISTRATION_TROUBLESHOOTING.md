# 🔧 Registration Troubleshooting Guide

## ✅ What I Fixed

1. **Enhanced Error Messages** - Now shows detailed error explanations instead of generic "Registration failed"
2. **Better Backend Connection Detection** - Detects if backend is unreachable
3. **Improved Error Handling** - Handles multiple error response formats
4. **Visual Error Display** - Red error alert box in the registration form

---

## ⚠️ Common Registration Errors & Solutions

### Error 1: "Cannot connect to backend"

**Cause:** Backend server is not running

**Solution:**
```bash
# Make sure backend is running on port 8080
cd backend/farmchainX
.\mvnw spring-boot:run
```

**Check if running:**
- Visit `http://localhost:8080/swagger-ui/index.html` 
- Should see Swagger API documentation

---

### Error 2: "Email already exists!"

**Cause:** You're trying to register with an email that already has an account

**Solution:**
- Use a different email address
- Or check with database if the email exists:
```bash
mysql -u root -p
USE farmchainX;
SELECT email FROM users WHERE email = 'your@email.com';
```

---

### Error 3: "Invalid form data"

**Cause:** Missing required fields or validation failed

**Check:**
- ✅ Full Name is not empty
- ✅ Email is valid format (name@domain.com)
- ✅ Password is at least 8 characters
- ✅ Password has: UPPERCASE, number, special character
- ✅ Passwords match
- ✅ Role is selected

---

### Error 4: "Role not found in DB" or "Role is required"

**Cause:** Database roles weren't initialized

**Solution:**
1. Restart backend (it will auto-seed roles on startup):
```bash
# Kill current backend
cd backend/farmchainX
.\mvnw spring-boot:run
```

2. Check if roles exist:
```bash
mysql -u root -p
USE farmchainX;
SELECT * FROM roles;
-- Should see: ROLE_CONSUMER, ROLE_FARMER, ROLE_DISTRIBUTOR, ROLE_RETAILER, ROLE_ADMIN
```

---

## 🔄 Testing Registration Step-by-Step

### Step 1: **Verify Backend is Running**
```
Visit: http://localhost:8080/swagger-ui/index.html
Expected: Swagger API documentation loads
```

### Step 2: **Verify Database Connection**
```bash
mysql -u root -p
USE farmchainX;
SELECT COUNT(*) FROM roles;
-- Should return 5 roles
```

### Step 3: **Test Registration**
Go to `http://localhost:14283/register` and try:
- **Name:** Test User
- **Email:** test@farmchainx.com  
- **Password:** Test@1234
- **Role:** Farmer

### Step 4: **Check if User Was Created**
```bash
mysql -u root -p
USE farmchainX;
SELECT email, name FROM users WHERE email = 'test@farmchainx.com';
```

---

## 🐛 Debug Steps

### 1. Check Terminal Output
- **Frontend errors:** Look in browser console (F12 → Console tab)
- **Backend errors:** Check backend terminal for stack traces

### 2. Network Tab
1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Try to register
4. Look for `auth/register` request
5. Check **Response** tab for error details

### 3. Backend Logs
Watch backend terminal for messages like:
```
[INFO] Registration request for email: test@email.com
[ERROR] Registration error: Email already exists!
```

### 4. Database Verification
```bash
# List all users
mysql -u root
USE farmchainX;
SELECT * FROM users;

# Check roles
SELECT * FROM roles;

# Check user-role mapping
SELECT u.email, r.name FROM users u JOIN user_roles ur ON u.id = ur.user_id JOIN roles r ON ur.role_id = r.id;
```

---

## 🚀 Quick Fix Checklist

- [ ] Backend running on `:8080`?
- [ ] MySQL database running?
- [ ] Database `farmchainX` exists?
- [ ] All 5 roles created in DB?
- [ ] Frontend running on `:14283`?
- [ ] All form fields valid?
- [ ] Check browser console (F12) for errors?
- [ ] Try with different email?

---

## 📞 Support Commands

**Restart Backend:**
```bash
cd backend/farmchainX
.\mvnw spring-boot:run
```

**Check Database:**
```bash
mysql -u root -p
```

**Clear Browser Cache:**
- Ctrl + Shift + Delete → Clear browsing data → All time

**Rebuild Frontend:**
```bash
cd frontend
npm start
```

---

## ✅ Success Indicators

✅ Registration form shows green checkmarks  
✅ Alert says "Registration successful! Redirecting to login..."  
✅ Redirected to login page  
✅ Can see user in database with: `SELECT * FROM users;`

---

**Last Updated:** 2026-02-22
