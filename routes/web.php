<?php

use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ClassController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\GymSettingsController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\MemberController;
use App\Http\Controllers\MemberPortalController;
use App\Http\Controllers\PackageController;
use App\Http\Controllers\POSController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\TrainerController;
use Illuminate\Support\Facades\Route;

// Redirect root to login
Route::get('/', function () {
    return redirect()->route('login');
});

// Authentication Routes
Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

// Authenticated Routes
Route::middleware(['auth'])->group(function () {

    // Common Notification Endpoints for all authenticated users (Member, Trainer, Staff, Owner)
    Route::post('/device-token', [AuthController::class, 'updateDeviceToken'])->middleware('throttle:30,1')->name('device-token.update');
    Route::post('/notifications/clear-all', [MemberPortalController::class, 'clearAllNotifications'])->name('notifications.clearAll');
    Route::post('/notifications/read-all', [MemberPortalController::class, 'markAllNotificationsRead'])->name('notifications.readAll');
    Route::post('/notifications/{id}/read', [MemberPortalController::class, 'markNotificationRead'])->name('notifications.read');
    Route::delete('/notifications/{id}', [MemberPortalController::class, 'destroyNotification'])->name('notifications.destroy');

    // Member Portal Routes
    Route::middleware(['role:Member'])->prefix('member')->name('member.')->group(function () {
        Route::get('/dashboard', [MemberPortalController::class, 'dashboard'])->name('dashboard');
        Route::get('/classes', [MemberPortalController::class, 'classes'])->middleware('feature:feature_class_booking')->name('classes');
        Route::post('/classes/{schedule}/book', [MemberPortalController::class, 'bookClass'])->middleware('feature:feature_class_booking')->name('classes.book');
        Route::post('/classes/{schedule}/cancel', [MemberPortalController::class, 'cancelClass'])->middleware('feature:feature_class_booking')->name('classes.cancel');
        Route::get('/trainers', [MemberPortalController::class, 'trainers'])->name('trainers');
        Route::get('/history', [MemberPortalController::class, 'history'])->name('history');
        Route::get('/profile', [MemberPortalController::class, 'profile'])->name('profile');
        Route::post('/profile', [MemberPortalController::class, 'updateProfile'])->name('profile.update');
        Route::delete('/profile/photo', [MemberPortalController::class, 'deletePhoto'])->name('profile.photo.delete');
    });

    // Admin Portal Common Routes (Owner, Manager, Front Desk, Sales, Trainer)
    Route::middleware(['role:Owner|Manager|Front Desk|Sales|Trainer'])->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'index'])->name('admin.dashboard');
        Route::get('/personal-trainer', [\App\Http\Controllers\PtSessionController::class, 'index'])->middleware('feature:feature_pt_booking')->name('pt-sessions.index');
        Route::get('/personal-trainer/create', [\App\Http\Controllers\PtSessionController::class, 'create'])->middleware('feature:feature_pt_booking')->name('pt-sessions.create');
        Route::post('/personal-trainer', [\App\Http\Controllers\PtSessionController::class, 'store'])->middleware('feature:feature_pt_booking')->name('pt-sessions.store');
        Route::post('/personal-trainer/store-multiple', [\App\Http\Controllers\PtSessionController::class, 'storeMultiple'])->middleware('feature:feature_pt_booking')->name('pt-sessions.store-multiple');
        Route::post('/personal-trainer/{ptSession}/cancel', [\App\Http\Controllers\PtSessionController::class, 'cancel'])->middleware('feature:feature_pt_booking')->name('pt-sessions.cancel');

        // Generic Profile Routes for all Admin roles (Owner, Manager, Front Desk, Sales, Trainer) - unified endpoint
        Route::get('/profile', [MemberPortalController::class, 'profile'])->name('admin.profile');
        Route::post('/profile', [MemberPortalController::class, 'updateProfile'])->name('admin.profile.update');
        Route::delete('/profile/photo', [MemberPortalController::class, 'deletePhoto'])->name('admin.profile.photo.delete');
    });

    // Trainer Only Routes
    Route::middleware(['role:Trainer'])->group(function () {
        Route::get('/trainer/profile', [\App\Http\Controllers\MemberPortalController::class, 'profile'])->name('trainer.profile');
        Route::post('/trainer/profile', [\App\Http\Controllers\MemberPortalController::class, 'updateProfile'])->name('trainer.profile.update');
        Route::delete('/trainer/profile/photo', [\App\Http\Controllers\MemberPortalController::class, 'deletePhoto'])->name('trainer.profile.photo.delete');
    });

    // Front Desk, Sales, Manager & Owner Routes (Members, POS, Kiosk, Attendance, Personal Trainer Management)
    Route::middleware(['role:Owner|Manager|Front Desk|Sales'])->group(function () {
        Route::get('/members', [MemberController::class, 'index'])->name('members.index');
        Route::post('/members', [MemberController::class, 'store'])->name('members.store');
        Route::post('/members/{member}/renew', [MemberController::class, 'renew'])->name('members.renew');
        Route::post('/members/{member}/freeze', [MemberController::class, 'freeze'])->name('members.freeze');
        Route::post('/members/{member}/reset-password', [MemberController::class, 'resetPassword'])->name('members.reset-password');
        Route::delete('/members/{member}', [MemberController::class, 'destroy'])->name('members.destroy');

        Route::get('/attendance/kiosk', [AttendanceController::class, 'kiosk'])->middleware('feature:feature_kiosk_qr')->name('attendance.kiosk');
        Route::post('/attendance/check-in', [AttendanceController::class, 'checkIn'])->middleware(['feature:feature_kiosk_qr', 'throttle:60,1'])->name('attendance.check-in');
        Route::post('/attendance/check-out-all', [AttendanceController::class, 'checkOutAllActive'])->name('attendance.check-out-all');
        Route::post('/attendance/{attendance}/check-out', [AttendanceController::class, 'checkOut'])->name('attendance.check-out');

        Route::get('/settings', [GymSettingsController::class, 'edit'])->name('settings.index');
        Route::get('/settings/gym-location', [GymSettingsController::class, 'edit'])->name('settings.gym-location');
        Route::post('/settings/gym-location', [GymSettingsController::class, 'update'])->name('settings.gym-location.update');
        Route::delete('/settings/photo', [GymSettingsController::class, 'deletePhoto'])->name('settings.photo.delete');

        Route::get('/pos', [POSController::class, 'index'])->middleware('feature:feature_pos_module')->name('pos.index');
        Route::get('/pos/receipt-settings', [POSController::class, 'receiptSettings'])->middleware('feature:feature_pos_module')->name('pos.receipt-settings');
        Route::post('/pos/receipt-settings', [POSController::class, 'updateReceiptSettings'])->middleware('feature:feature_pos_module')->name('pos.receipt-settings.update');
        Route::post('/pos/register-member', [POSController::class, 'registerMember'])->middleware('feature:feature_pos_module')->name('pos.register-member');
        Route::post('/pos/checkout', [POSController::class, 'checkout'])->middleware('feature:feature_pos_module')->name('pos.checkout');
    });

    // Trainer, Front Desk, Sales, Manager & Owner Log/Classes View
    Route::middleware(['role:Owner|Manager|Front Desk|Sales|Trainer'])->group(function () {
        Route::get('/attendance', [AttendanceController::class, 'index'])->name('attendance.index');
    });

    // Trainer, Manager & Owner Routes (Classes, Trainers)
    Route::middleware(['role:Owner|Manager|Trainer'])->group(function () {
        Route::get('/classes', [ClassController::class, 'index'])->middleware('feature:feature_class_booking')->name('classes.index');
        Route::post('/classes', [ClassController::class, 'storeClass'])->middleware('feature:feature_class_booking')->name('classes.store');
        Route::post('/classes/schedules', [ClassController::class, 'storeSchedule'])->middleware('feature:feature_class_booking')->name('classes.schedules.store');
        Route::post('/classes/{gymClass}', [ClassController::class, 'updateClass'])->middleware('feature:feature_class_booking')->name('classes.update');
        Route::delete('/classes/{gymClass}', [ClassController::class, 'destroyClass'])->middleware('feature:feature_class_booking')->name('classes.destroy');

        Route::get('/trainers', [TrainerController::class, 'index'])->name('trainers.index');
        Route::post('/trainers', [TrainerController::class, 'storeTrainer'])->name('trainers.store');
        Route::post('/trainers/{trainer}', [TrainerController::class, 'updateTrainer'])->name('trainers.update');
    });

    // Owner Only Routes (User Management) — role changes require password re-confirmation
    Route::middleware(['role:Owner'])->group(function () {
        Route::get('/users', [\App\Http\Controllers\UserController::class, 'index'])->name('users.index');
        Route::post('/users', [\App\Http\Controllers\UserController::class, 'store'])->name('users.store');
        Route::put('/users/{user}/role', [\App\Http\Controllers\UserController::class, 'updateRole'])->middleware('password.confirm')->name('users.update-role');
        Route::delete('/users/{user}', [\App\Http\Controllers\UserController::class, 'destroy'])->middleware('password.confirm')->name('users.destroy');
    });

    // Owner & Manager Only Routes (Packages, Inventory, Reports, AI Assistant, Broadcast, Dev Mode)
    Route::middleware(['role:Owner|Manager'])->group(function () {
        Route::post('/settings/broadcast', [GymSettingsController::class, 'broadcast'])->middleware('throttle:10,1')->name('settings.broadcast');
        // Dev Mode routes — hard guard handled inside controller via ensureDevModeAllowed() + route-level local-only gate
        Route::post('/settings/dev-mode/notify', [GymSettingsController::class, 'testNotification'])->name('settings.dev-mode.notify');
        Route::post('/settings/dev-mode/toggle-feature', [GymSettingsController::class, 'toggleFeature'])->name('settings.dev-mode.toggle-feature');
        Route::post('/settings/dev-mode/clear-notifications', [GymSettingsController::class, 'clearNotifications'])->name('settings.dev-mode.clear-notifications');
        Route::post('/settings/dev-mode/clear-all-notifications', [GymSettingsController::class, 'clearAllNotificationsGlobal'])->name('settings.dev-mode.clear-all-notifications');
        Route::post('/settings/dev-mode/mock-class', [GymSettingsController::class, 'mockClassSession'])->name('settings.dev-mode.mock-class');
        Route::post('/settings/dev-mode/mock-pt', [GymSettingsController::class, 'mockPtSession'])->name('settings.dev-mode.mock-pt');
        Route::post('/settings/dev-mode/mock-attendance', [GymSettingsController::class, 'mockAttendance'])->name('settings.dev-mode.mock-attendance');
        Route::post('/settings/dev-mode/extend-membership', [GymSettingsController::class, 'extendMembership'])->name('settings.dev-mode.extend-membership');
        Route::post('/settings/dev-mode/mock-sale', [GymSettingsController::class, 'mockSale'])->name('settings.dev-mode.mock-sale');
        Route::post('/settings/dev-mode/mock-expense', [GymSettingsController::class, 'mockExpense'])->name('settings.dev-mode.mock-expense');
        Route::post('/settings/dev-mode/mock-membership-trx', [GymSettingsController::class, 'mockMembershipTransaction'])->name('settings.dev-mode.mock-membership-trx');
        Route::post('/settings/dev-mode/mock-bulk-attendance', [GymSettingsController::class, 'mockBulkAttendance'])->name('settings.dev-mode.mock-bulk-attendance');
        Route::post('/settings/dev-mode/mock-bulk-sales', [GymSettingsController::class, 'mockBulkSales'])->name('settings.dev-mode.mock-bulk-sales');
        Route::post('/settings/dev-mode/mock-bulk-class-bookings', [GymSettingsController::class, 'mockBulkClassBookings'])->name('settings.dev-mode.mock-bulk-class-bookings');
        Route::post('/settings/dev-mode/clear-activity-logs', [GymSettingsController::class, 'clearActivityLogs'])->name('settings.dev-mode.clear-activity-logs');
        Route::post('/settings/dev-mode/health-check', [GymSettingsController::class, 'healthCheck'])->name('settings.dev-mode.health-check');
        Route::post('/settings/dev-mode/wipe-dev-data', [GymSettingsController::class, 'wipeDevData'])->name('settings.dev-mode.wipe-dev-data');
        Route::post('/settings/dev-mode/clear-cache', [GymSettingsController::class, 'clearCache'])->name('settings.dev-mode.clear-cache');
        Route::post('/settings/dev-mode/clear-log', [GymSettingsController::class, 'clearLog'])->name('settings.dev-mode.clear-log');
        Route::post('/settings/dev-mode/mock-expired-membership', [GymSettingsController::class, 'mockExpiredMembership'])->name('settings.dev-mode.mock-expired-membership');
        Route::post('/settings/dev-mode/mock-low-stock', [GymSettingsController::class, 'mockLowStock'])->name('settings.dev-mode.mock-low-stock');
        Route::post('/settings/dev-mode/create-dummy-member', [GymSettingsController::class, 'createDummyMember'])->name('settings.dev-mode.create-dummy-member');
        Route::get('/owner/ai-assistant', [\App\Http\Controllers\OwnerChatController::class, 'index'])->name('owner.ai-assistant.index');
        Route::post('/owner/ai-assistant/ask', [\App\Http\Controllers\OwnerChatController::class, 'ask'])->middleware('throttle:10,1')->name('owner.ai-assistant.ask');
        Route::get('/owner/ai-assistant/ask', fn() => redirect()->route('owner.ai-assistant.index'));
        Route::get('/packages', [PackageController::class, 'index'])->name('packages.index');
        Route::post('/packages', [PackageController::class, 'store'])->name('packages.store');
        Route::put('/packages/{package}', [PackageController::class, 'update'])->name('packages.update');
        Route::post('/pt-packages', [PackageController::class, 'storePtPackage'])->name('pt-packages.store');
        Route::put('/pt-packages/{ptPackage}', [PackageController::class, 'updatePtPackage'])->name('pt-packages.update');
        Route::delete('/pt-packages/{ptPackage}', [PackageController::class, 'destroyPtPackage'])->name('pt-packages.destroy');

        Route::get('/inventory', [InventoryController::class, 'index'])->name('inventory.index');
        Route::post('/inventory/products', [InventoryController::class, 'storeProduct'])->name('inventory.products.store');
        Route::post('/inventory/products/{product}/adjust', [InventoryController::class, 'adjustStock'])->name('inventory.products.adjust');
        Route::delete('/inventory/products/{product}', [InventoryController::class, 'destroyProduct'])->name('inventory.products.destroy');

        Route::get('/expenses', [ExpenseController::class, 'index'])->name('expenses.index');
        Route::post('/expenses', [ExpenseController::class, 'store'])->name('expenses.store');
        Route::post('/expenses/{expense}', [ExpenseController::class, 'update'])->name('expenses.update');
        Route::delete('/expenses/{expense}', [ExpenseController::class, 'destroy'])->name('expenses.destroy');

        Route::get('/reports', [ReportController::class, 'index'])->name('reports.index');
    });
});
