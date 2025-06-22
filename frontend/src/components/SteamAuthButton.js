import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

const SteamAuthButton = () => {
  const navigate = useNavigate();
  const [steamId, setSteamId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Direct Steam ID submission
  const handleSubmitSteamId = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await api.post('/users/profile', { steam_id: steamId });
      window.location.reload(); // Refresh to show updated profile
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to link Steam account');
      console.error('Steam connection error:', err);
    } finally {
      setLoading(false);
    }
  };

  // OpenID auth flow
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
    <div style={{ marginTop: '20px' }}>
      <button 
        onClick={handleSteamAuth}
        style={{ background: '#171a21', color: 'white', padding: '10px 15px', marginBottom: '15px' }}
      >
        <img 
          src="https://steamcdn-a.akamaihd.net/steamcommunity/public/images/steamworks_docs/english/sits_large_noborder.png" 
          alt="Sign in through Steam" 
          style={{ height: '20px', marginRight: '10px' }}
        />
        Connect via Steam Login
      </button>
      
      <div style={{ marginTop: '15px' }}>
        <form onSubmit={handleSubmitSteamId} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <label htmlFor="steamId" style={{ marginRight: '10px', display: 'block', marginBottom: '5px' }}>
              Or enter your Steam ID directly:
            </label>
            <input 
              id="steamId"
              type="text" 
              value={steamId} 
              onChange={(e) => setSteamId(e.target.value)}
              placeholder="Enter Steam ID or vanity URL"
              style={{ padding: '8px', width: '100%', background: '#333', color: 'white', border: '1px solid #555' }}
            />
          </div>
          {error && <p style={{ color: '#ff6b6b', margin: '5px 0' }}>{error}</p>}
          <button 
            type="submit" 
            disabled={loading} 
            style={{
              background: loading ? '#555' : '#171a21', 
              color: 'white', 
              padding: '8px 15px',
              cursor: loading ? 'not-allowed' : 'pointer',
              width: 'fit-content'
            }}
          >
            {loading ? 'Connecting...' : 'Connect'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SteamAuthButton;