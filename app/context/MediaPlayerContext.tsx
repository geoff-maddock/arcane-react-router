import React, { type ReactNode } from 'react';
import { MediaPlayerContext } from './MediaPlayerContextDefinition';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface MediaPlayerProviderProps {
    children: ReactNode;
    storageKey?: string;
    defaultEnabled?: boolean;
}

export const MediaPlayerProvider: React.FC<MediaPlayerProviderProps> = ({
    children,
    storageKey = 'mediaPlayersEnabled',
    defaultEnabled = true
}) => {
    const [mediaPlayersEnabled, setMediaPlayersEnabledState] = useLocalStorage<boolean>(storageKey, defaultEnabled);

    const setMediaPlayersEnabled = (enabled: boolean) => {
        setMediaPlayersEnabledState(enabled);
    };

    const toggleMediaPlayers = () => {
        setMediaPlayersEnabledState((prev) => !prev);
    };

    return (
        <MediaPlayerContext.Provider value={{
            mediaPlayersEnabled,
            setMediaPlayersEnabled,
            toggleMediaPlayers
        }}>
            {children}
        </MediaPlayerContext.Provider>
    );
};

