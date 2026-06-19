import React from 'react';
import Cookies from 'js-cookie';
import Layout from './Layout';
import GuestLayout from './GuestLayout';
import Docs from '../pages/Docs';

const DocsWrapper = () => {
    const token = Cookies.get('token');

    if (token) {
        return (
            <Layout>
                <Docs />
            </Layout>
        );
    }

    return (
        <GuestLayout>
            <Docs />
        </GuestLayout>
    );
};

export default DocsWrapper;
