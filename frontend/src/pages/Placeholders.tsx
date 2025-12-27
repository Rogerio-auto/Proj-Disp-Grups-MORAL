import React from 'react';

const PlaceholderPage: React.FC<{ title: string }> = ({ title }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
      <p className="mt-2 text-gray-600">Esta funcionalidade será implementada em breve.</p>
    </div>
  );
};

export const MessagesPage = () => <PlaceholderPage title="Mensagens" />;
export const GroupsPage = () => <PlaceholderPage title="Grupos" />;
export const CampaignsPage = () => <PlaceholderPage title="Campanhas" />;
export const SettingsPage = () => <PlaceholderPage title="Configurações" />;
