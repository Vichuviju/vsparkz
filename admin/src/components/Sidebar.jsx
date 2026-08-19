import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { canAccessPath } from '../config/permissions';
import { logoUrl } from '../lib/publicUrl';

// Structure exactly mapping the mockup screenshot
const SIDEBAR_SECTIONS = [
  {
    title: 'MAIN',
    items: [
      {
        type: 'link',
        to: '/',
        label: 'Dashboard',
        icon: (
          <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
        )
      },
      {
        type: 'accordion',
        label: 'Super Admin',
        icon: (
          <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.248-8.25-3.286zm0 13.036h.008v.008H12v-.008z" />
          </svg>
        ),
        subItems: [
          { to: '/super-admin', label: 'Super Admin DB' },
          { to: '/super-admin/vip-approvals', label: 'VIP Approvals' },
          { to: '/roles-permissions', label: 'Roles & Perms' },
          { to: '/platform-admin', label: 'Platform DB' },
          { to: '/platform-admin/tenants', label: 'Tenants' },
          { to: '/platform-admin/plans', label: 'Platform Plans' },
          { to: '/platform-admin/subscriptions', label: 'Subscriptions' },
          { to: '/plans', label: 'Plans' },
          { to: '/agencies', label: 'Agencies' }
        ]
      }
    ]
  },
  {
    title: 'TALENT MANAGEMENT',
    items: [
      {
        type: 'accordion',
        label: 'Influencers',
        icon: (
          <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
          </svg>
        ),
        subItems: [
          { to: '/influencers', label: 'All Influencers' },
          { to: '/influencers/add', label: 'Add Influencer' },
          { to: '/influencers/assigned', label: 'Assigned to Me' },
          { to: '/influencers/categories', label: 'Categories' },
          { to: '/influencers/platforms', label: 'Platforms' }
        ]
      },
      {
        type: 'accordion',
        label: 'Freelancers',
        icon: (
          <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
          </svg>
        ),
        subItems: [
          { to: '/freelancers', label: 'All Freelancers' },
          { to: '/freelancers/add', label: 'Add Freelancer' },
          { to: '/freelancers/assigned', label: 'Assigned to Me' },
          { to: '/freelancers/skills', label: 'Skills / Services' },
          { to: '/freelancers/categories', label: 'Categories' }
        ]
      }
    ]
  },
  {
    title: 'CRM & SALES',
    items: [
      {
        type: 'accordion',
        label: 'CRM',
        icon: (
          <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        ),
        subItems: [
          { to: '/clients', label: 'Clients' },
          { to: '/leads', label: 'Leads' },
          { to: '/deals', label: 'Companies' },
          { to: '/onboarding-questionnaires', label: 'Onboarding' },
          { to: '/forms', label: 'Forms' }
        ]
      }
    ]
  },
  {
    title: 'MARKETING OS',
    items: [
      {
        type: 'accordion',
        label: 'Campaigns',
        icon: (
          <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53L6.75 15.75H4.5A2.25 2.25 0 012.25 13.5v-3a2.25 2.25 0 012.25-2.25h2.25z" />
          </svg>
        ),
        subItems: [
          { to: '/campaigns', label: 'Campaigns' },
          { to: '/social-planner', label: 'Social Planner' },
          { to: '/ads', label: 'Ads Performance' },
          { to: '/seo-workspace', label: 'SEO Workspace' },
          { to: '/seo-analyzer', label: 'SEO Analyzer' }
        ]
      },
      {
        type: 'link',
        to: '/landing-builder',
        label: 'Landing Builder',
        icon: (
          <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
          </svg>
        )
      },
      {
        type: 'link',
        to: '/email-automation',
        label: 'AI Automation',
        icon: (
          <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l5-5h6.25A2.25 2.25 0 0022.5 13.75V4.25A2.25 2.25 0 0020.25 2H3.75A2.25 2.25 0 001.5 4.25v9.5A2.25 2.25 0 003.75 16h6.063z" />
          </svg>
        )
      }
    ]
  },
  {
    title: 'PROJECT DELIVERY',
    items: [
      {
        type: 'accordion',
        label: 'Projects',
        icon: (
          <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.008 1.24l.885 1.77a2.25 2.25 0 002.007 1.24h1.98a2.25 2.25 0 002.007-1.24l.885-1.77a2.25 2.25 0 012.007-1.24h3.86m-18 0h18" />
          </svg>
        ),
        subItems: [
          { to: '/projects', label: 'Projects List' },
          { to: '/assign-project', label: 'Assign Project' },
          { to: '/requirement-gatherings', label: 'Requirement handling' },
          { to: '/requirement-templates', label: 'Req Templates' },
          { to: '/workflows', label: 'Workflows' },
          { to: '/automation', label: 'Automation Rules' }
        ]
      }
    ]
  },
  {
    title: 'SERVICES & PACKAGES',
    items: [
      {
        type: 'accordion',
        label: 'Services & Offers',
        icon: (
          <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581a1.125 1.125 0 001.591 0l4.318-4.318a1.125 1.125 0 000-1.591L9.568 3z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
          </svg>
        ),
        subItems: [
          { to: '/services', label: 'Services' },
          { to: '/sub-services', label: 'Sub-Services' },
          { to: '/pricing-levels', label: 'Pricing Levels' },
          { to: '/service-prices', label: 'Service Prices' },
          { to: '/service-packages', label: 'Service Packages' },
          { to: '/combo-packages', label: 'Combo Packages' },
          { to: '/package-generator', label: 'Package Generator' },
          { to: '/brands', label: 'Brands' }
        ]
      }
    ]
  },
  {
    title: 'FINANCE & RESOURCE',
    items: [
      {
        type: 'accordion',
        label: 'Finance',
        icon: (
          <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-19.5 5.25h19.5" />
          </svg>
        ),
        subItems: [
          { to: '/invoices', label: 'Invoices' },
          { to: '/quotations', label: 'Quotations' },
          { to: '/agreements', label: 'Agreements' }
        ]
      },
      {
        type: 'accordion',
        label: 'Resources',
        icon: (
          <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72M12 12a3 3 0 100-6 3 3 0 000 6z" />
          </svg>
        ),
        subItems: [
          { to: '/team', label: 'Team' },
          { to: '/vendors', label: 'Vendors' },
          { to: '/tasks-hr', label: 'Tasks / HR' }
        ]
      }
    ]
  },
  {
    title: 'HR MANAGEMENT',
    items: [
      {
        type: 'link',
        to: '/hrms/admin/dashboard',
        label: 'HR Dashboard',
        icon: (
          <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
          </svg>
        )
      },
      {
        type: 'accordion',
        label: 'Employees',
        icon: (
          <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        ),
        subItems: [
          { to: '/hrms/core/employees', label: 'Employee List' },
          { to: '/hrms/departments', label: 'Departments' },
        ]
      },
      {
        type: 'accordion',
        label: 'Time & Leave',
        icon: (
          <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        subItems: [
          { to: '/hrms/attendance/dashboard', label: 'Attendance' },
          { to: '/hrms/leave/dashboard', label: 'Leaves' },
          { to: '/hrms/approvals/unified', label: 'Approvals' },
        ]
      },
      {
        type: 'accordion',
        label: 'Payroll & Expense',
        icon: (
          <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        ),
        subItems: [
          { to: '/hrms/payroll/dashboard', label: 'Payroll' },
          { to: '/hrms/expense/management', label: 'Expenses' },
          { to: '/hrms/compliance/dashboard', label: 'Compliance' },
        ]
      },
      {
        type: 'link',
        to: '/hrms/ess/dashboard',
        label: 'My ESS Portal',
        icon: (
          <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        )
      },
      {
        type: 'link',
        to: '/hrms/admin/settings',
        label: 'HR Settings',
        icon: (
          <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        )
      }
    ]
  },
  {
    title: 'SYSTEM',
    items: [
      {
        type: 'accordion',
        label: 'Reports & Audits',
        icon: (
          <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25" />
          </svg>
        ),
        subItems: [
          { to: '/reports', label: 'Reports' },
          { to: '/report-templates', label: 'Report Templates' },
          { to: '/compliance', label: 'Compliance & Audits' }
        ]
      },
      {
        type: 'link',
        to: '/knowledge-base',
        label: 'Knowledge Base',
        icon: (
          <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
        )
      },
      {
        type: 'link',
        to: '/integrations',
        label: 'Integrations',
        icon: (
          <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
          </svg>
        )
      },
      {
        type: 'link',
        to: '/system-settings',
        label: 'System Settings',
        icon: (
          <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281m0 0A12.001 12.001 0 009 9c0 1.052.136 2.072.394 3.04l-1.281.213m0 0A12.001 12.001 0 003.94 9" />
          </svg>
        )
      },
      {
        type: 'link',
        to: '/settings',
        label: 'Settings',
        icon: (
          <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="3" strokeWidth="2.2" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281" />
          </svg>
        )
      }
    ]
  }
];

export function Sidebar({ open = false, onClose }) {
  const { user, logout, branding } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;
  
  const role = (user?.role ?? user?.effective_role ?? '').toString().trim().toLowerCase();
  const permissions = user?.permissions ?? [];
  const logoSrc = logoUrl(branding?.branding?.logo_path);

  // Track toggle states of accordions dynamically
  const [openGroups, setOpenGroups] = useState({});

  useEffect(() => {
    // Automatically open accordion if a subItem within it is currently active
    const newOpens = { ...openGroups };
    SIDEBAR_SECTIONS.forEach(section => {
      section.items.forEach(item => {
        if (item.type === 'accordion' && item.subItems) {
          const hasActiveSub = item.subItems.some(sub => path === sub.to || path.startsWith(sub.to + '/'));
          if (hasActiveSub) {
            newOpens[item.label] = true;
          }
        }
      });
    });
    setOpenGroups(newOpens);
  }, [path]);

  const toggleGroup = (label) => {
    setOpenGroups(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const handleLogout = async () => {
    await logout();
    onClose?.();
    navigate('/login');
  };

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      {open ? (
        <button
          type="button"
          className="lg:hidden fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-[1px]"
          aria-label="Close menu"
          onClick={onClose}
        />
      ) : null}
    <aside
      className={`w-[min(17rem,88vw)] flex flex-col fixed inset-y-0 left-0 h-full bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-white/10 shrink-0 z-50 lg:z-20 transform transition-transform duration-200 ease-out pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] ${
        open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
    >
      
      {/* Brand Logo Header */}
      <div className="px-5 py-5 border-b border-slate-50 dark:border-slate-800 shrink-0">
        <Link to="/" className="flex items-center gap-3 no-underline">
          <img
            src={logoSrc}
            alt="V-Sparkz Digital"
            className="h-9 w-9 object-contain"
          />
          <div className="min-w-0">
            <p className="text-sm font-black text-slate-800 dark:text-white tracking-tight leading-none">V-Sparkz</p>
            <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 tracking-wider uppercase">Digital</span>
          </div>
        </Link>
      </div>

      {/* Navigation Sections Area */}
      <nav className="flex-1 p-3.5 overflow-y-auto space-y-6 scrollbar-thin">
        {SIDEBAR_SECTIONS.map((section) => {
          // Filter section items by user access permission
          const allowedItems = section.items.filter(item => {
            if (item.type === 'link') {
              return canAccessPath(item.to, role, permissions);
            }
            if (item.type === 'accordion') {
              // Accordion is allowed if at least one subItem is allowed
              return item.subItems.some(sub => canAccessPath(sub.to, role, permissions));
            }
            return false;
          });

          if (allowedItems.length === 0) return null;

          return (
            <div key={section.title} className="space-y-1.5">
              <span className="px-3.5 text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                {section.title}
              </span>
              <div className="space-y-1">
                {allowedItems.map((item) => {
                  
                  // Render direct NavLink
                  if (item.type === 'link') {
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.to === '/'}
                        onClick={onClose}
                        className={({ isActive }) =>
                          `flex items-center justify-between px-3.5 py-2 text-xs rounded-xl no-underline font-bold transition-all duration-200 ${
                            isActive
                              ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 shadow-sm'
                              : 'text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/40'
                          }`
                        }
                      >
                        <div className="flex items-center gap-2.5">
                          {item.icon}
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className="px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 text-[9px] font-extrabold tracking-wider uppercase">
                            {item.badge}
                          </span>
                        )}
                      </NavLink>
                    );
                  }

                  // Render Accordion Group Dropdown
                  if (item.type === 'accordion') {
                    const isOpen = !!openGroups[item.label];
                    const hasActiveSub = item.subItems.some(sub => path === sub.to || path.startsWith(sub.to + '/'));
                    const filteredSubItems = item.subItems.filter(sub => canAccessPath(sub.to, role, permissions));

                    return (
                      <div key={item.label} className="space-y-1">
                        <button
                          type="button"
                          onClick={() => toggleGroup(item.label)}
                          className={`w-full flex items-center justify-between px-3.5 py-2 text-left text-xs rounded-xl transition-all duration-200 select-none font-bold ${
                            hasActiveSub || isOpen
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/40'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {item.icon}
                            <span>{item.label}</span>
                          </div>
                          <svg
                            className={`w-3.5 h-3.5 transition-transform duration-200 shrink-0 text-slate-400 ${isOpen ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        {isOpen && (
                          <div className="pl-4 pr-1 py-1 space-y-1 ml-3 border-l border-slate-100 dark:border-slate-800">
                            {filteredSubItems.map((sub) => (
                              <NavLink
                                key={sub.to}
                                to={sub.to}
                                onClick={onClose}
                                className={({ isActive }) =>
                                  `block px-3 py-2 text-xs rounded-xl no-underline font-semibold transition-all ${
                                    isActive
                                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 font-bold'
                                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/40'
                                  }`
                                }
                              >
                                {sub.label}
                              </NavLink>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }

                  return null;
                })}
              </div>
            </div>
          );
        })}

        {/* Upgrade to Pro Premium Teaser Card */}
        <div className="relative overflow-hidden p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-800/40 dark:to-slate-800/10 border border-slate-100 dark:border-slate-800/50 mt-4 space-y-3">
          <div className="flex items-center gap-2 text-slate-800 dark:text-white">
            {/* Rocket vector indicator */}
            <svg className="w-4 h-4 text-blue-500 float-rotate" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-2.2 2.2m2.2-2.2a6 6 0 00-2.2-2.2m2.2 2.2L21 9M13.39 16.57a6 6 0 01-2.2-2.2m2.2 2.2L9 21m0 0L3 15m0 0l6-6M3 15h18" />
            </svg>
            <span className="text-xs font-black tracking-tight">Upgrade to Pro</span>
          </div>
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 leading-normal">
            Unlock advanced features, AI assistants and SEO workspaces.
          </p>
          <button 
            type="button" 
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/10 transition-colors rounded-xl text-[10px] font-extrabold"
          >
            Upgrade Now
          </button>
        </div>

      </nav>

      {/* User Profile Footer section */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-black uppercase shadow-sm border border-slate-100 dark:border-slate-850">
            {user?.name ? user.name.slice(0, 2) : 'VI'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-800 dark:text-white truncate leading-none mb-0.5">{user?.name ?? 'Vichu'}</p>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide capitalize">{role}</span>
          </div>
          <button 
            type="button" 
            onClick={handleLogout}
            className="text-slate-400 hover:text-rose-500 p-1.5 rounded-lg transition-colors"
            title="Log Out"
          >
            <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 3l3-3m0 0l-3-3m3 3H9" />
            </svg>
          </button>
        </div>
      </div>
      
    </aside>
    </>
  );
}
