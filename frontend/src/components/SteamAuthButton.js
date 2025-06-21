import React from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

const SteamAuthButton = () => {
  const navigate = useNavigate();

  const handleSteamAuth = async () => {
    try {
      // Open Steam authentication in new window
      const authWindow = window.open(
        'https://steamcommunity.com/openid/login?' +
        'openid.ns=http://specs.openid.net/auth/2.0&' +
        'openid.mode=checkid_setup&' +
        'openid.return_to=' + encodeURIComponent(`${window.location.origin}/auth/steam/callback`) + '&' +
        'openid.realm=' + encodeURIComponent(window.location.origin) + '&' +
        'openid.identity=http://specs.openid.net/auth/2.0/identifier_select&' +
        'openid.claimed_id=http://specs.openid.net/auth/2.0/identifier_select',
        'SteamAuth',
        'width=800,height=600'
      );

      // Listen for auth completion
      window.addEventListener('message', (event) => {
        if (event.data.steamAuthComplete) {
          authWindow.close();
          navigate('/profile');
        }
      }, false);
    } catch (error) {
      console.error('Steam auth error:', error);
    }
  };

  return (
    <button 
      onClick={handleSteamAuth}
      style={{ background: '#171a21', color: 'white', padding: '10px 15px' }}
    >
      <img 
        src="https://steamcdn-a.akamaihd.net/steamcommunity/public/images/steamworks_docs/english/sits_large_noborder.png" 
        alt="Sign in through Steam" 
        style={{ height: '20px', marginRight: '10px' }}
      />
      Connect Steam Account
    </button>
  );
};

export default SteamAuthButton;