import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import ContactList from '../components/ContactList';

const ContactsPage: React.FC = () => {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>Contacts - Outreach Mate</title>
        <meta name="description" content="Manage your contacts and leads" />
      </Head>

      <Layout>
        <div className="container mx-auto px-4 py-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
            <p className="text-gray-500">Manage your contacts and leads</p>
          </div>

          <ContactList />
        </div>
      </Layout>
    </>
  );
};

export default ContactsPage;