export interface AvatarOption {
    id: string;
    icon: string;
    name: string;
}

export const GLADIATOR_AVATARS: AvatarOption[] = [
    { id: 'swords', icon: '⚔️', name: 'Espadachim' },
    { id: 'shield', icon: '🛡️', name: 'Centurião' },
    { id: 'lion', icon: '🦁', name: 'Leão' },
    { id: 'eagle', icon: '🦅', name: 'Águia' },
    { id: 'crown', icon: '👑', name: 'Imperador' },
    { id: 'lightning', icon: '⚡', name: 'Trovão' },
    { id: 'bow', icon: '🏹', name: 'Arqueiro' },
    { id: 'fire', icon: '🔥', name: 'Espartano' }
];

export const DEFAULT_AVATAR = '⚔️';
