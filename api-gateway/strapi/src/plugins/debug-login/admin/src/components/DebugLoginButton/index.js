// 🎭 Debug Login Button - The Development Portal
// "Where convenience meets mystical authentication"

import React, { useState } from 'react';
import { Button } from '@strapi/design-system/Button';
import { Flex } from '@strapi/design-system/Flex';
import { Box } from '@strapi/design-system/Box';
import { Typography } from '@strapi/design-system/Typography';
import { Select, Option } from '@strapi/design-system/Select';
import { useAuth, request } from '@strapi/helper-plugin';
import { Bug, Login } from '@strapi/icons';

const DebugLoginButton = () => {
  const { setToken, setUserInfo } = useAuth();
  const [selectedUser, setSelectedUser] = useState('mom@api-router.cloud');
  const [isLogging, setIsLogging] = useState(false);

  // 🎭 Our mystical cast of development users
  const debugUsers = [
    {
      email: 'mom@api-router.cloud',
      password: 'MomAdmin123!',
      name: '👩‍💼 Mom (Main Admin)',
      role: 'Super Admin'
    },
    {
      email: 'dev@api-router.cloud',
      password: 'DevUser123!',
      name: '👨‍💻 Developer',
      role: 'Developer'
    },
    {
      email: 'editor@api-router.cloud',
      password: 'Editor123!',
      name: '✏️ Content Editor',
      role: 'Editor'
    },
    {
      email: 'viewer@api-router.cloud',
      password: 'Viewer123!',
      name: '👁️ Content Viewer',
      role: 'Viewer'
    }
  ];

  // 🔮 The magical login ritual
  const handleDebugLogin = async () => {
    const user = debugUsers.find(u => u.email === selectedUser);
    if (!user) return;

    setIsLogging(true);

    try {
      console.log(`🐛 Debug Login: Attempting login as ${user.name}`);
      
      const response = await request('/admin/login', {
        method: 'POST',
        body: {
          email: user.email,
          password: user.password,
        },
      });

      if (response.data) {
        console.log(`✨ Debug Login: Successfully logged in as ${user.name}`);
        
        // 🌟 Set the authentication token
        setToken(response.data.token);
        
        // 🎯 Set user info
        setUserInfo(response.data.user);
        
        // 🎊 Reload the page to complete the login
        window.location.reload();
      }
    } catch (error) {
      console.error('💥 Debug Login failed:', error);
      
      // 🌊 If user doesn't exist, show helpful message
      if (error.response?.status === 400) {
        alert(`🎭 User ${user.email} doesn't exist yet. You can create it manually or this is expected for dev users that haven't been created.`);
      } else {
        alert('🌩️ Debug login failed. Check console for details.');
      }
    } finally {
      setIsLogging(false);
    }
  };

  // 🌙 Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <Box 
      background="neutral100" 
      padding={4} 
      borderRadius="4px"
      marginTop={2}
      style={{
        border: '2px dashed #ffd700',
        backgroundColor: '#fffbf0'
      }}
    >
      <Flex direction="column" alignItems="stretch" gap={3}>
        <Flex alignItems="center" gap={2}>
          <Bug fill="#ff6b35" />
          <Typography variant="beta" textColor="warning600">
            🎭 Development Debug Login
          </Typography>
        </Flex>
        
        <Typography variant="pi" textColor="neutral600">
          Quick login without passwords - Development mode only
        </Typography>

        <Select
          label="Select User"
          value={selectedUser}
          onChange={setSelectedUser}
          placeholder="Choose a user to login as..."
        >
          {debugUsers.map((user) => (
            <Option key={user.email} value={user.email}>
              {user.name} ({user.role})
            </Option>
          ))}
        </Select>

        <Button
          onClick={handleDebugLogin}
          loading={isLogging}
          startIcon={<Login />}
          variant="secondary"
          size="L"
        >
          {isLogging ? '🌟 Logging in...' : `🚀 Login as ${debugUsers.find(u => u.email === selectedUser)?.name || 'Selected User'}`}
        </Button>

        <Typography variant="pi" textColor="neutral500">
          💡 Tip: This button only appears in development mode
        </Typography>
      </Flex>
    </Box>
  );
};

export default DebugLoginButton;
