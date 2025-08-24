# ⚠️ SECURITY DISABLED FOR TESTING ⚠️

## Current Status: SECURITY DISABLED

This application currently has **ALL SECURITY CHECKS DISABLED** for testing purposes.

## What's Been Disabled:

### NestJS Backend:
- ✅ Helmet security middleware
- ✅ CORS restrictions (now allows all origins)
- ✅ JWT authentication guards
- ✅ Role-based authorization guards
- ✅ User authentication checks

### Angular Frontend:
- ✅ Login requirement bypassed
- ✅ Route protection disabled
- ✅ Authentication checks bypassed

## Files Modified:

### Backend:
- `src/main.ts` - Disabled helmet, allowed all CORS origins
- `src/modules/programs/programs.controller.ts` - Disabled guards and roles
- `src/modules/categories/categories.controller.ts` - Disabled guards and roles
- `src/modules/languages/languages.controller.ts` - Disabled guards and roles
- `src/modules/auth/auth.controller.ts` - Disabled JWT guard

### Frontend:
- `frontend/projects/cms/src/app/app.routes.ts` - Bypass login redirect
- `frontend/projects/cms/src/app/components/login/login.ts` - Auto-redirect to dashboard
- `frontend/projects/cms/src/app/components/dashboard/dashboard.ts` - Mock user data

## ⚠️ IMPORTANT: Re-enable Security Before Deployment

**BEFORE DEPLOYING TO PRODUCTION**, you MUST re-enable all security features:

1. **Uncomment all security imports and guards**
2. **Restore CORS configuration to specific origins**
3. **Re-enable helmet middleware**
4. **Restore authentication requirements**
5. **Re-enable route protection**

## Quick Re-enable Checklist:

### Backend:
- [ ] Uncomment helmet import and usage in `src/main.ts`
- [ ] Restore CORS origin configuration in `src/main.ts`
- [ ] Uncomment all `@UseGuards` decorators
- [ ] Uncomment all `@Roles` decorators
- [ ] Restore user authentication logic

### Frontend:
- [ ] Restore login redirect in `app.routes.ts`
- [ ] Remove auto-redirect in `login.ts`
- [ ] Restore authentication checks in `dashboard.ts`

## Testing Notes:
- All endpoints are now accessible without authentication
- Mock user data is being used
- CORS allows all origins
- Security headers are disabled

**Remember: This is for LOCAL TESTING ONLY!**
