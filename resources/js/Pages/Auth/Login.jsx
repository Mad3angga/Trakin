import React, { useState, useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import { Dumbbell, ShieldCheck, UserCheck, User } from 'lucide-react';
import MobileLoginView from '@/Components/Auth/MobileLoginView';
import DesktopLoginView from '@/Components/Auth/DesktopLoginView';

export default function Login() {
    const [showPassword, setShowPassword] = useState(false);
    const isMobileInitial = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
    const [selectedRole, setSelectedRole] = useState(isMobileInitial ? 'Member' : 'Owner');
    const [isMobile, setIsMobile] = useState(isMobileInitial);

    // Detect mobile device or screen width < 768px
    useEffect(() => {
        const checkIsMobile = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            if (mobile && selectedRole === 'Owner') {
                setSelectedRole('Member');
            }
        };

        checkIsMobile();
        window.addEventListener('resize', checkIsMobile);
        return () => window.removeEventListener('resize', checkIsMobile);
    }, []);

    const { data, setData, post, processing, errors } = useForm({
        email: isMobileInitial ? 'member@trakin.com' : 'owner@trakin.com',
        password: 'password',
    });

    useEffect(() => {
        if (isMobile && data.email === 'owner@trakin.com') {
            setData({ email: 'member@trakin.com', password: 'password' });
            setSelectedRole('Member');
        }
    }, [isMobile]);

    const demoAccounts = [
        { role: 'Owner', email: 'owner@trakin.com', pass: 'password', icon: ShieldCheck, desc: 'Owner Gym' },
        { role: 'Front Desk', email: 'frontdesk@trakin.com', pass: 'password', icon: UserCheck, desc: 'Kasir & Admin' },
        { role: 'Sales', email: 'sales@trakin.com', pass: 'password', icon: UserCheck, desc: 'Sales & Kasir' },
        { role: 'Trainer', email: 'alex@trakin.com', pass: 'password', icon: Dumbbell, desc: 'Coach PT' },
        { role: 'Member', email: 'member@trakin.com', pass: 'password', icon: User, desc: 'Member' },
    ];

    const handleSelectDemo = (acc) => {
        setSelectedRole(acc.role);
        setData({
            email: acc.email,
            password: acc.pass,
        });
    };

    const handleSubmit = (e) => {
        console.log('[DEBUG] handleSubmit called', {
            event: e ? 'exists' : 'null',
            data,
            processing,
            currentURL: window.location.href,
            userAgent: navigator.userAgent,
        });
        
        if (e) e.preventDefault();
        
        console.log('[DEBUG] About to call post(/login)');
        
        post('/login', {
            preserveScroll: false,
            onStart: () => {
                console.log('[DEBUG] Inertia request started');
            },
            onSuccess: (page) => {
                console.log('[DEBUG] Login success:', {
                    component: page.component,
                    url: page.url,
                    auth: page.props.auth,
                    hasUser: !!page.props.auth?.user,
                    errors: page.props.errors,
                });
                
                if (page.props.auth?.user && page.component === 'Auth/Login') {
                    console.log('[DEBUG] User authenticated, forcing redirect...');
                    window.location.href = '/admin/dashboard';
                }
            },
            onError: (err) => {
                console.error('[DEBUG] Login error:', err);
            },
            onFinish: () => {
                console.log('[DEBUG] Inertia request finished');
            },
        });
        
        console.log('[DEBUG] post() function called');
    };

    const commonProps = {
        data,
        setData,
        processing,
        errors,
        demoAccounts,
        selectedRole,
        handleSelectDemo,
        handleSubmit,
        showPassword,
        setShowPassword,
    };

    return isMobile ? (
        <MobileLoginView {...commonProps} />
    ) : (
        <DesktopLoginView {...commonProps} />
    );
}
