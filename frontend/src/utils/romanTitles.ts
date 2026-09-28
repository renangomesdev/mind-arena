export interface RomanTitleInfo {
    title: string;
    subtitle: string;
    icon: string;
    badgeClass: string;
}

export function getRomanTitle(rank: number): RomanTitleInfo {
    switch (rank) {
        case 1:
            return {
                title: 'Imperador da Arena',
                subtitle: 'Magnus Triumphator',
                icon: '👑',
                badgeClass: 'border-yellow-400/60 bg-gradient-to-r from-yellow-500/20 via-amber-500/15 to-yellow-500/20 text-yellow-300 shadow-[0_0_20px_rgba(234,179,8,0.3)]'
            };
        case 2:
            return {
                title: 'Centurião Lendário',
                subtitle: 'Invictus Bellator',
                icon: '⚔️',
                badgeClass: 'border-gray-300/50 bg-gradient-to-r from-gray-400/20 via-slate-400/15 to-gray-400/20 text-gray-200 shadow-[0_0_15px_rgba(156,163,175,0.25)]'
            };
        case 3:
            return {
                title: 'Gladiador de Elite',
                subtitle: 'Primus Palus',
                icon: '🛡️',
                badgeClass: 'border-amber-600/50 bg-gradient-to-r from-amber-700/20 via-orange-600/15 to-amber-700/20 text-amber-300 shadow-[0_0_15px_rgba(217,119,6,0.25)]'
            };
        default:
            return {
                title: 'Combatente Valente',
                subtitle: 'Legionarius Arenae',
                icon: '🏛️',
                badgeClass: 'border-dark-600/50 bg-dark-800/60 text-dark-300'
            };
    }
}
