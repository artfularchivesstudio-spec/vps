// 🎭 Debug Login Button Extension - The Development Portal
// "Where convenience meets mystical authentication in the login realm"

import React, { useState } from 'react';
import { Button } from '@strapi/design-system/Button';
import { Flex } from '@strapi/design-system/Flex';
import { Box } from '@strapi/design-system/Box';
import { Typography } from '@strapi/design-system/Typography';
import { Select, Option } from '@strapi/design-system/Select';
import { request } from '@strapi/helper-plugin';
import { Bug, Login } from '@strapi/icons';

const DebugLoginButton = ({ onLogin }) => {
  const [selectedUser, setSelectedUser] = useState('mom@api-router.cloud');
  const [isLogging, setIsLogging] = useState(false);

  // 🎭 Our mystical cast of development users
  const debugUsers = [
    {
      email: 'mom@api-router.cloud',
      password: 'MomAdmin123!',
      name: '👩‍💼 Mom',
      role: 'Main Admin',
      description: 'Primary administrator with full access'
    },
    {
      email: 'dev@example.com',
      password: 'DevUser123!',
      name: '👨‍💻 Developer',
      role: 'Developer',
      description: 'Development user for testing'
    },
    {
      email: 'editor@example.com',
      password: 'Editor123!',
      name: '✏️ Editor',
      role: 'Content Editor',
      description: 'Content management and editing'
    },
    {
      email: 'viewer@example.com',
      password: 'Viewer123!',
      name: '👁️ Viewer',
      role: 'Read Only',
      description: 'View-only access for content'
    }
  ];

  // 🔮 The magical quick-login ritual
  const handleDebugLogin = async () => {
    const user = debugUsers.find(u => u.email === selectedUser);
    if (!user) return;

    setIsLogging(true);

    try {
      console.log(`🐛 Debug Login: Attempting login as ${user.name} (${user.email})`);
      
      const response = await fetch('/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
          password: user.password,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✨ Debug Login: Successfully authenticated ${user.name}`);
        
        // 🎊 Store the token and reload
        if (data.data?.token) {
          localStorage.setItem('jwtToken', data.data.token);
          window.location.reload();
        }
      } else {
        const errorData = await response.json();
        console.warn('🌊 Debug Login: User may not exist or password incorrect:', errorData);
        
        // 🎭 Show helpful message
        alert(`🎭 Quick Login Note: ${user.name} (${user.email}) may not exist yet.\\n\\nThis is normal for dev users. The main admin (Mom) should work if the migration completed successfully.`);
      }
    } catch (error) {
      console.error('💥 Debug Login failed:', error);
      alert('🌩️ Debug login encountered an error. Check console for details.');
    } finally {
      setIsLogging(false);
    }
  };

  // 🌙 Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const selectedUserData = debugUsers.find(u => u.email === selectedUser);

  return (
    <Box 
      background="neutral0" 
      padding={4} 
      borderRadius="8px"
      marginTop={4}
      style={{
        border: '2px dashed #ffd700',
        backgroundColor: '#fffef7',
        boxShadow: '0 2px 8px rgba(255, 215, 0, 0.1)'
      }}
    >
      <Flex direction="column" alignItems="stretch" gap={3}>
        <Flex alignItems="center" gap={2}>
          <Bug fill="#ff6b35" width="20px" height="20px" />
          <Typography variant="beta" textColor="warning600">
            🎭 Development Quick Login
          </Typography>
        </Flex>
        
        <Typography variant="pi" textColor="neutral600">
          Skip password entry during development - saves time! ⚡
        </Typography>

        <Box>
          <Typography variant="pi" fontWeight="semiBold" textColor="neutral700" marginBottom={2}>
            Select User Account:
          </Typography>
          <Select
            value={selectedUser}
            onChange={setSelectedUser}
            placeholder="Choose a user..."
            size="S"
          >
            {debugUsers.map((user) => (
              <Option key={user.email} value={user.email}>
                {user.name} - {user.role}
              </Option>
            ))}
          </Select>
        </Box>

        {selectedUserData && (
          <Box 
            padding={2} 
            background="neutral100" 
            borderRadius="4px"
          >
            <Typography variant="pi" textColor="neutral600">
              📧 {selectedUserData.email}
            </Typography>
            <br />
            <Typography variant="pi" textColor="neutral500">
              {selectedUserData.description}
            </Typography>
          </Box>
        )}

        <Button
          onClick={handleDebugLogin}
          loading={isLogging}
          startIcon={<Login />}
          variant="secondary"
          size="L"
          fullWidth
        >
          {isLogging ? '🌟 Signing in...' : `🚀 Quick Login as ${selectedUserData?.name || 'Selected User'}`}
        </Button>

        <Typography variant="pi" textColor="neutral400" textAlign="center">
          💡 This button only appears in development mode
        </Typography>
      </Flex>
    </Box>
  );
};

export default DebugLoginButton;
