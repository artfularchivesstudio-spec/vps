// 🎭 Custom Auth Page - Enhanced Login Experience
// "Where authentication meets development convenience"

import React from 'react';
import { Layout } from '@strapi/design-system/Layout';
import { Main } from '@strapi/design-system/Main';
import { ContentLayout } from '@strapi/design-system/ContentLayout';
import { Box } from '@strapi/design-system/Box';
import DebugLoginButton from '../../extensions/DebugLoginButton';

// 🌟 This component will enhance the default login page
const EnhancedAuthPage = (props) => {
  return (
    <Layout>
      <Main>
        <ContentLayout>
          <Box paddingTop={6} paddingBottom={6}>
            {/* 🎭 Render the original auth page content */}
            <div id="original-auth-content">
              {/* The original Strapi login form will be here */}
            </div>
            
            {/* 🐛 Add our debug login button in development */}
            <DebugLoginButton />
          </Box>
        </ContentLayout>
      </Main>
    </Layout>
  );
};

export default EnhancedAuthPage;
