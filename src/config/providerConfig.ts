// Provider configuration for Outreach Mate integrations
// This defines all available integrations that can be connected

export interface Provider {
  id: string;
  name: string;
  developer: string;
  description: string;
  categories: string[];
  authType: 'oauth2' | 'apiKey' | 'basic';
  logoUrl?: string;
  logoBackground?: string;
  documentation?: string;
  features?: string[];
  actionKitSupport: boolean;
  authConfig?: {
    oauthScopes?: string[];
    apiKeyName?: string;
    instructionsUrl?: string;
  };
  popular: boolean;
}

export const providerConfig: Provider[] = [
  {
    id: 'gmail',
    name: 'Gmail',
    developer: 'Google',
    description: 'Connect with Gmail to send emails directly from your Outreach Mate campaigns.',
    categories: ['email', 'communication'],
    authType: 'oauth2',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Gmail_icon_%282020%29.svg/2560px-Gmail_icon_%282020%29.svg.png',
    documentation: 'https://developers.google.com/gmail/api',
    features: [
      'Send personalized emails',
      'Track opens and clicks',
      'Manage email threads',
      'Schedule emails',
      'Access email templates'
    ],
    actionKitSupport: true,
    authConfig: {
      oauthScopes: [
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.readonly'
      ],
      instructionsUrl: 'https://developers.google.com/gmail/api/quickstart/js'
    },
    popular: true
  },
  {
    id: 'outlook',
    name: 'Microsoft Outlook',
    developer: 'Microsoft',
    description: 'Connect your Outlook account to send emails and access calendar for scheduling.',
    categories: ['email', 'communication', 'calendar'],
    authType: 'oauth2',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Microsoft_Office_Outlook_%282018%E2%80%93present%29.svg/1200px-Microsoft_Office_Outlook_%282018%E2%80%93present%29.svg.png',
    documentation: 'https://docs.microsoft.com/en-us/graph/api/resources/mail-api-overview',
    features: [
      'Send personalized emails',
      'Track opens and clicks',
      'Schedule meetings',
      'Manage calendar events',
      'Access email templates'
    ],
    actionKitSupport: true,
    authConfig: {
      oauthScopes: [
        'Mail.Send',
        'Mail.ReadWrite',
        'Calendars.ReadWrite'
      ],
      instructionsUrl: 'https://docs.microsoft.com/en-us/graph/auth-register-app-v2'
    },
    popular: true
  },
  {
    id: 'apollo',
    name: 'Apollo.io',
    developer: 'Apollo',
    description: 'Enrich company and contact data using Apollo.io\'s powerful database of over 265M contacts.',
    categories: ['data enrichment', 'sales intelligence', 'crm'],
    authType: 'apiKey',
    logoUrl: 'https://theme.zdassets.com/theme_assets/9462525/cfc866c5f98f64c46a6f40d16ad45504fe0936d5.png',
    documentation: 'https://apolloio.github.io/apollo-api-docs/',
    features: [
      'Company data enrichment',
      'Contact discovery',
      'Email verification',
      'LinkedIn profile mapping',
      'Job title and seniority filtering'
    ],
    actionKitSupport: true,
    authConfig: {
      apiKeyName: 'X-API-Key',
      instructionsUrl: 'https://apolloio.github.io/apollo-api-docs/'
    },
    popular: true
  },
  {
    id: 'openai',
    name: 'OpenAI',
    developer: 'OpenAI',
    description: 'Use OpenAI\'s powerful language models to generate hyper-personalized email content.',
    categories: ['ai', 'content generation'],
    authType: 'apiKey',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/OpenAI_Logo.svg/1280px-OpenAI_Logo.svg.png',
    documentation: 'https://platform.openai.com/docs/api-reference',
    features: [
      'Email content generation',
      'Personalized messaging',
      'Subject line creation',
      'Follow-up suggestions',
      'Content optimization'
    ],
    actionKitSupport: true,
    authConfig: {
      apiKeyName: 'Authorization',
      instructionsUrl: 'https://platform.openai.com/docs/api-reference/authentication'
    },
    popular: true
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    developer: 'Google',
    description: 'Leverage Google\'s Gemini API for advanced data transformation and content generation.',
    categories: ['ai', 'data transformation', 'content generation'],
    authType: 'apiKey',
    logoUrl: 'https://storage.googleapis.com/gweb-uniblog-publish-prod/images/gemini-advanced.max-1000x1000.png',
    documentation: 'https://ai.google.dev/docs',
    features: [
      'Raw data transformation',
      'Structured JSON generation',
      'Content summarization',
      'Multi-source data synthesis',
      'Contextual analysis'
    ],
    actionKitSupport: true,
    authConfig: {
      apiKeyName: 'API-Key',
      instructionsUrl: 'https://ai.google.dev/docs/authentication'
    },
    popular: true
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    developer: 'LinkedIn',
    description: 'Connect your LinkedIn account for data enrichment and professional networking.',
    categories: ['social media', 'networking', 'data enrichment'],
    authType: 'oauth2',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/LinkedIn_logo_initials.png/800px-LinkedIn_logo_initials.png',
    documentation: 'https://docs.microsoft.com/en-us/linkedin/',
    features: [
      'Profile data access',
      'Company information',
      'Recent activity tracking',
      'Professional network analysis'
    ],
    actionKitSupport: false,
    popular: true
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    developer: 'Salesforce',
    description: 'Integrate with Salesforce CRM to sync contacts, leads, and campaign data.',
    categories: ['crm', 'sales intelligence'],
    authType: 'oauth2',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Salesforce.com_logo.svg/2560px-Salesforce.com_logo.svg.png',
    documentation: 'https://developer.salesforce.com/docs/',
    features: [
      'Contact synchronization',
      'Lead management',
      'Opportunity tracking',
      'Campaign integration',
      'Activity logging'
    ],
    actionKitSupport: true,
    popular: false
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    developer: 'HubSpot',
    description: 'Connect with HubSpot for comprehensive marketing, sales, and CRM functionality.',
    categories: ['crm', 'marketing automation', 'email'],
    authType: 'oauth2',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Hubspot_Logo.svg/2560px-Hubspot_Logo.svg.png',
    documentation: 'https://developers.hubspot.com/docs/api/overview',
    features: [
      'Contact management',
      'Email marketing',
      'Marketing automation',
      'Sales pipeline',
      'Activity tracking'
    ],
    actionKitSupport: true,
    popular: false
  },
  {
    id: 'intercom',
    name: 'Intercom',
    developer: 'Intercom',
    description: 'Integrate with Intercom for customer messaging and support functionality.',
    categories: ['customer support', 'communication'],
    authType: 'oauth2',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/3c/Intercom_logo.svg',
    documentation: 'https://developers.intercom.com/',
    features: [
      'Customer messaging',
      'Conversation history',
      'Support ticket management',
      'User profiles',
      'Automated responses'
    ],
    actionKitSupport: true,
    popular: false
  },
  {
    id: 'stripe',
    name: 'Stripe',
    developer: 'Stripe',
    description: 'Process payments and manage subscriptions with Stripe integration.',
    categories: ['payments', 'billing'],
    authType: 'apiKey',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Stripe_Logo%2C_revised_2016.svg/2560px-Stripe_Logo%2C_revised_2016.svg.png',
    documentation: 'https://stripe.com/docs/api',
    features: [
      'Payment processing',
      'Subscription management',
      'Invoice generation',
      'Payment analytics',
      'Refund handling'
    ],
    actionKitSupport: true,
    popular: false
  },
  {
    id: 'slack',
    name: 'Slack',
    developer: 'Slack',
    description: 'Integrate with Slack to send notifications and updates about outreach activities.',
    categories: ['communication', 'notifications'],
    authType: 'oauth2',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Slack_icon_2019.svg/2048px-Slack_icon_2019.svg.png',
    documentation: 'https://api.slack.com/',
    features: [
      'Channel notifications',
      'Direct messages',
      'Thread responses',
      'Workflow alerts',
      'Status updates'
    ],
    actionKitSupport: true,
    popular: false
  },
  {
    id: 'twitter',
    name: 'Twitter (X)',
    developer: 'X Corp',
    description: 'Connect with Twitter/X for social engagement and monitoring.',
    categories: ['social media', 'monitoring'],
    authType: 'oauth2',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/X_icon_2023.svg/800px-X_icon_2023.svg.png',
    documentation: 'https://developer.twitter.com/en/docs',
    features: [
      'Tweet monitoring',
      'Engagement tracking',
      'Profile analysis',
      'Sentiment analysis',
      'Trend identification'
    ],
    actionKitSupport: true,
    popular: false
  },
  {
    id: 'calendar',
    name: 'Google Calendar',
    developer: 'Google',
    description: 'Integrate with Google Calendar to schedule meetings and manage availability.',
    categories: ['calendar', 'scheduling'],
    authType: 'oauth2',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Google_Calendar_icon_%282020%29.svg/2048px-Google_Calendar_icon_%282020%29.svg.png',
    documentation: 'https://developers.google.com/calendar',
    features: [
      'Meeting scheduling',
      'Availability management',
      'Event creation',
      'Calendar syncing',
      'Reminder setting'
    ],
    actionKitSupport: true,
    popular: false
  }
];