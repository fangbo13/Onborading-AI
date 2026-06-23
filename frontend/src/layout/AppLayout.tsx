import { useTranslation } from 'react-i18next';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, Button, Drawer, Modal, Card, Typography } from 'antd';
import {
  MessageOutlined,
  HistoryOutlined,
  BookOutlined,
  UserOutlined,
  LogoutOutlined,
  SunOutlined,
  MoonOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  GlobalOutlined,
  RocketOutlined,
} from '@ant-design/icons';
import { useAuth } from '../auth/AuthProvider';
import { useTheme } from '../hooks/useTheme';
import { useMemo, useCallback, useState, useEffect } from 'react';
import i18n from '../i18n';

const { Text } = Typography;

const { Header, Sider, Content } = Layout;

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(() => {
    // On tablet widths, default to collapsed for better content space
    if (typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerWidth <= 1024) {
      return true;
    }
    const saved = localStorage.getItem('ey-sidebar-collapsed');
    return saved === 'true';
  });
  const { effective, setThemeMode } = useTheme();
  const isDark = effective === 'dark';
  const { t } = useTranslation('common');

  // Mobile responsive state
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [isTablet, setIsTablet] = useState(() => window.innerWidth >= 768 && window.innerWidth <= 1024);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Onboarding tour state
  const [onboardingVisible, setOnboardingVisible] = useState(() => {
    return !localStorage.getItem('ey-onboarding-seen');
  });

  // Interactive multi-step tour state
  const [tourStep, setTourStep] = useState(-1); // -1 = not in tour mode
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const tourSteps = useMemo(() => [
    { target: 'tour-nav-chat', title: t('tour_step_chat_title'), desc: t('tour_step_chat_desc') },
    { target: 'tour-nav-history', title: t('tour_step_history_title'), desc: t('tour_step_history_desc') },
    { target: 'tour-nav-knowledge', title: t('tour_step_knowledge_title'), desc: t('tour_step_knowledge_desc') },
    { target: 'tour-nav-profile', title: t('tour_step_profile_title'), desc: t('tour_step_profile_desc') },
  ], [t]);

  // Compute target element position for tour tooltip
  useEffect(() => {
    if (tourStep < 0 || tourStep >= tourSteps.length) {
      setTargetRect(null);
      return;
    }
    const el = document.getElementById(tourSteps[tourStep].target);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);
      el.classList.add('tour-highlight');
      return () => el.classList.remove('tour-highlight');
    }
  }, [tourStep, tourSteps]);

  useEffect(() => {
    const handler = () => {
      const w = window.innerWidth;
      setIsMobile(w < 768);
      setIsTablet(w >= 768 && w <= 1024);
      // Auto-collapse sidebar when entering tablet range
      if (w >= 768 && w <= 1024 && !isTablet) {
        setCollapsed(true);
      }
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [isMobile, isTablet]);

  // Normalize root path to /chat for menu highlight
  const selectedKey = location.pathname === '/' ? '/chat' : location.pathname;

  // Memoize menu items to prevent unnecessary re-renders
  const menuItems = useMemo(() => [
    { key: '/chat', icon: <MessageOutlined />, label: <span id="tour-nav-chat">{t('nav_chat')}</span>, 'aria-current': selectedKey === '/chat' ? 'page' as const : undefined },
    { key: '/history', icon: <HistoryOutlined />, label: <span id="tour-nav-history">{t('nav_history')}</span>, 'aria-current': selectedKey === '/history' ? 'page' as const : undefined },
    ...(user?.is_hr_admin
      ? [{ key: '/admin/knowledge', icon: <BookOutlined />, label: <span id="tour-nav-knowledge">{t('nav_knowledge')}</span>, 'aria-current': selectedKey === '/admin/knowledge' ? 'page' as const : undefined }]
      : []),
    { key: '/profile', icon: <UserOutlined />, label: <span id="tour-nav-profile">{t('nav_profile')}</span>, 'aria-current': selectedKey === '/profile' ? 'page' as const : undefined },
  ], [selectedKey, user?.is_hr_admin, t]);

  // Memoize user dropdown menu
  const userMenu = useMemo(() => ({
    items: [
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: t('logout'),
        onClick: async () => {
          await logout();
          navigate('/login');
        },
      },
    ],
  }), [logout, navigate, t]);

  // Memoize theme toggle handler
  const handleThemeToggle = useCallback(() => {
    setThemeMode(isDark ? 'light' : 'dark');
  }, [isDark, setThemeMode]);

  // Language switch
  const currentLang = i18n.language?.startsWith('zh') ? 'zh' : 'en';
  const handleLangChange = useCallback((lang: 'zh' | 'en') => {
    i18n.changeLanguage(lang);
    localStorage.setItem('ey-language', lang);
  }, []);

  const langMenu = useMemo(() => ({
    items: [
      {
        key: 'zh',
        label: '中文',
        icon: currentLang === 'zh' ? <span style={{ color: '#0052FF' }}>●</span> : null,
        onClick: () => handleLangChange('zh'),
      },
      {
        key: 'en',
        label: 'English',
        icon: currentLang === 'en' ? <span style={{ color: '#0052FF' }}>●</span> : null,
        onClick: () => handleLangChange('en'),
      },
    ],
  }), [currentLang, handleLangChange]);

  // Sidebar collapse toggle with persistence
  const handleToggleCollapsed = useCallback(() => {
    setCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('ey-sidebar-collapsed', String(next));
      return next;
    });
  }, []);

  // Onboarding tour handler
  const handleOnboardingClose = useCallback(() => {
    localStorage.setItem('ey-onboarding-seen', 'true');
    setOnboardingVisible(false);
  }, []);

  // Onboarding feature cards data
  const onboardingFeatures = useMemo(() => [
    { icon: <MessageOutlined style={{ fontSize: 24 }} />, title: t('onboarding_chat_title'), desc: t('onboarding_chat_desc') },
    { icon: <HistoryOutlined style={{ fontSize: 24 }} />, title: t('onboarding_history_title'), desc: t('onboarding_history_desc') },
    { icon: <BookOutlined style={{ fontSize: 24 }} />, title: t('onboarding_knowledge_title'), desc: t('onboarding_knowledge_desc') },
    { icon: <UserOutlined style={{ fontSize: 24 }} />, title: t('onboarding_profile_title'), desc: t('onboarding_profile_desc') },
  ], [t]);

  // Tour handlers
  const handleStartTour = useCallback(() => {
    setOnboardingVisible(false);
    localStorage.setItem('ey-onboarding-seen', 'true');
    setTourStep(0);
  }, []);

  const handleTourNext = useCallback(() => {
    if (tourStep < tourSteps.length - 1) {
      setTourStep(prev => prev + 1);
    } else {
      setTourStep(-1);
      localStorage.setItem('ey-onboarding-tour-done', 'true');
    }
  }, [tourStep, tourSteps.length]);

  const handleTourSkip = useCallback(() => {
    setTourStep(-1);
    localStorage.setItem('ey-onboarding-tour-done', 'true');
  }, []);

  // Sider logo/header content (reused in Drawer)
  const siderHeader = (
    <div style={{
      padding: 16,
      borderBottom: '1px solid var(--color-border-secondary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    }}>
      <div style={{
        width: 32,
        height: 32,
        borderRadius: 8,
        background: 'linear-gradient(135deg, #0052FF, #4D7CFF)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxShadow: '0 2px 8px rgba(0, 82, 255, 0.25)',
      }}>
        <span style={{ fontSize: 14, fontWeight: 800, color: '#FFFFFF', lineHeight: 1 }}>EY</span>
      </div>
      <h2 style={{
        margin: 0,
        fontSize: 16,
        fontWeight: 600,
        color: 'var(--color-text)',
        whiteSpace: 'nowrap',
        transition: 'opacity 0.2s ease',
        opacity: collapsed ? 0 : 1,
        pointerEvents: 'none',
      }}>Onboarding</h2>
      <Button
        type="text"
        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        onClick={handleToggleCollapsed}
        aria-label={collapsed ? t('expand_sidebar') : t('collapse_sidebar')}
        aria-expanded={!collapsed}
        style={{
          color: 'var(--color-text-secondary)',
          flexShrink: 0,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      />
    </div>
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Onboarding tour modal for first-time users */}
      <Modal
        open={onboardingVisible}
        onCancel={handleOnboardingClose}
        footer={
          <Button
            type="primary"
            size="large"
            icon={<RocketOutlined />}
            onClick={handleStartTour}
            style={{ borderRadius: 12, fontWeight: 500, padding: '0 32px' }}
          >
            {t('onboarding_start')}
          </Button>
        }
        centered
        closable={false}
        width={520}
        className="onboarding-modal"
      >
        <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 56,
            height: 56,
            borderRadius: 14,
            background: 'linear-gradient(135deg, #0052FF, #4D7CFF)',
            marginBottom: 16,
            boxShadow: '0 6px 20px rgba(0, 82, 255, 0.25)',
          }}>
            <span style={{ fontSize: 24, fontWeight: 800, color: '#FFFFFF' }}>EY</span>
          </div>
          <Typography.Title level={4} style={{ margin: '0 0 4px', fontWeight: 600 }}>
            {t('onboarding_title')}
          </Typography.Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            {t('onboarding_subtitle')}
          </Text>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 20 }}>
          {onboardingFeatures.map((feature) => (
            <Card
              key={feature.title}
              size="small"
              hoverable
              style={{
                borderRadius: 12,
                borderColor: 'var(--color-border-secondary)',
                textAlign: 'center',
              }}
              styles={{ body: { padding: '16px 12px' } }}
            >
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: 'rgba(0, 82, 255, 0.08)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 8,
                color: 'var(--accent)',
              }}>
                {feature.icon}
              </div>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{feature.title}</div>
              <Text type="secondary" style={{ fontSize: 12, lineHeight: 1.4, display: 'block' }}>
                {feature.desc}
              </Text>
            </Card>
          ))}
        </div>
      </Modal>

      {/* Interactive multi-step tour overlay */}
      {tourStep >= 0 && tourStep < tourSteps.length && (
        <>
          {/* Dark overlay */}
          <div
            className="tour-overlay"
            onClick={handleTourSkip}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.6)',
              zIndex: 999,
              cursor: 'pointer',
            }}
          />
          {/* Tour tooltip */}
          {targetRect && (
          <div
            className="tour-tooltip"
            role="dialog"
            aria-label="Onboarding tour"
            style={{
              position: 'fixed',
              top: targetRect.top - 8,
              left: targetRect.right + 16,
              transform: 'translateY(-50%)',
              zIndex: 1000,
              background: 'var(--color-bg-container)',
              borderRadius: 16,
              padding: '20px 24px',
              maxWidth: 300,
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.2)',
              border: '1px solid var(--color-border)',
              animation: 'fadeInUp 0.3s ease-out',
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 8,
            }}>
              <Typography.Text strong style={{ fontSize: 14, color: 'var(--color-text)' }}>
                {tourSteps[tourStep].title}
              </Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {tourStep + 1}/{tourSteps.length}
              </Typography.Text>
            </div>
            <Typography.Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 16, lineHeight: 1.5 }}>
              {tourSteps[tourStep].desc}
            </Typography.Text>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button
                type="text"
                size="small"
                onClick={handleTourSkip}
                style={{ fontSize: 12 }}
              >
                {t('tour_skip')}
              </Button>
              <Button
                type="primary"
                size="small"
                onClick={handleTourNext}
                style={{ borderRadius: 8, fontSize: 12 }}
              >
                {tourStep < tourSteps.length - 1 ? t('tour_next') : t('tour_finish')}
              </Button>
            </div>
          </div>
          )}
        </>
      )}

      {/* Skip to content link */}
      <a
        href="#main-content"
        style={{
          position: 'absolute',
          top: -40,
          left: 0,
          background: 'var(--accent)',
          color: '#fff',
          padding: '8px 16px',
          zIndex: 9999,
          textDecoration: 'none',
          transition: 'top 0.2s',
        }}
        onFocus={(e) => { e.currentTarget.style.top = '0'; }}
        onBlur={(e) => { e.currentTarget.style.top = '-40px'; }}
      >
        {t('skip_to_content') || 'Skip to main content'}
      </a>

      {/* Desktop Sider */}
      {!isMobile && (
        <Sider
          collapsed={collapsed}
          collapsible={false}
          breakpoint="md"
          collapsedWidth={64}
          role="navigation"
          aria-label={t('nav_sidebar') || 'Navigation sidebar'}
          style={{
            borderRight: '1px solid var(--color-border-secondary)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {siderHeader}
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            items={menuItems}
            onClick={({ key }) => navigate(key)}
            style={{ border: 'none' }}
          />
        </Sider>
      )}

      {/* Mobile Drawer */}
      {isMobile && (
        <Drawer
          placement="left"
          onClose={() => setMobileDrawerOpen(false)}
          open={mobileDrawerOpen}
          width={280}
          styles={{ body: { padding: 0 } }}
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'linear-gradient(135deg, #0052FF, #4D7CFF)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#FFFFFF' }}>EY</span>
              </div>
              <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text)' }}>Onboarding</span>
            </div>
          }
        >
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            items={menuItems}
            onClick={({ key }) => {
              navigate(key);
              setMobileDrawerOpen(false);
            }}
            style={{ border: 'none' }}
          />
        </Drawer>
      )}

      <Layout>
        <Header style={{
          background: 'var(--color-bg-container)',
          padding: '0 24px',
          borderBottom: '1px solid var(--color-border-secondary)',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          height: 56,
          lineHeight: '56px',
          transition: 'background 0.3s ease, border-color 0.3s ease',
        }}>
          {/* Mobile hamburger button */}
          {isMobile && (
            <Button
              type="text"
              icon={<MenuUnfoldOutlined />}
              onClick={() => setMobileDrawerOpen(true)}
              aria-label={t('mobile_menu') || 'Open mobile menu'}
              style={{ marginRight: 12, color: 'var(--color-text-secondary)' }}
            />
          )}

          <Dropdown menu={langMenu} placement="bottomRight">
            <Button
              type="text"
              icon={<GlobalOutlined />}
              aria-label={t('language_switch') || 'Switch language'}
              style={{
                color: currentLang === 'zh' ? '#0052FF' : 'var(--color-text-secondary)',
                marginRight: 8,
              }}
              title={currentLang === 'zh' ? '切换至 English' : 'Switch to 中文'}
            />
          </Dropdown>
          <Button
            type="text"
            icon={isDark ? <SunOutlined /> : <MoonOutlined />}
            onClick={handleThemeToggle}
            aria-label={isDark ? t('switch_to_light') : t('switch_to_dark')}
            style={{ marginRight: 16, color: 'var(--color-text-secondary)' }}
            title={isDark ? t('switch_to_light') : t('switch_to_dark')}
          />
          <Dropdown menu={userMenu}>
            <Button
              type="text"
              aria-label={t('user_menu') || 'User menu'}
              style={{
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '0 8px',
                color: 'var(--color-text)',
              }}
            >
              <Avatar icon={<UserOutlined />} size="small" style={{ marginRight: 8 }} />
              <span style={{
                maxWidth: 200,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>{user?.email}</span>
            </Button>
          </Dropdown>
        </Header>
        <Content style={{
          margin: 16,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          <main id="main-content" role="main" style={{ flex: 1, minHeight: 0 }}>
            <div className="page-enter">
              <Outlet />
            </div>
          </main>
        </Content>
      </Layout>
    </Layout>
  );
}
