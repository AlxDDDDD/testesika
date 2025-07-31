import Parent from '../../../_dummy.js';

class EspionageTpl extends Parent {
    constructor(data) {
        super(data);
        this.data = data;
        this.espionageTargets = data.espionageTargets || [];
    }

    // Coleta dados de espionagem
    getEspionageData() {
        const espionageData = {
            targets: [],
            totalTargets: 0
        };

        this.espionageTargets.forEach(target => {
            if (!target.id) return;

            const targetData = {
                id: target.id,
                name: target.name || 'Desconhecido',
                player: target.player || 'Desconhecido',
                alliance: target.alliance || '',
                townHallLevel: target.townHallLevel || 0,
                wallLevel: target.wallLevel || 0,
                travelTime: target.travelTime || '0:00:00',
                location: target.location || { x: 0, y: 0 },
                resources: {
                    lootable: target.resources?.lootable || { wood: 0, wine: 0, marble: 0, glass: 0, sulfur: 0 },
                    looted: target.resources?.looted || { wood: 0, wine: 0, marble: 0, glass: 0, sulfur: 0 }
                },
                combats: target.combats || 0,
                militaryScore: target.militaryScore || 0,
                occupiedBy: target.occupiedBy || null,
                blockadedBy: target.blockadedBy || null,
                lastSpyTime: target.lastSpyTime || null,
                playerState: target.playerState || 'active'
            };

            espionageData.targets.push(targetData);
        });

        espionageData.totalTargets = espionageData.targets.length;
        
        // Ordena por tempo de viagem
        espionageData.targets.sort((a, b) => {
            const timeA = this.parseTime(a.travelTime);
            const timeB = this.parseTime(b.travelTime);
            return timeA - timeB;
        });

        return espionageData;
    }

    // Converte tempo em string para segundos
    parseTime(timeString) {
        if (!timeString || timeString === '0:00:00') return 0;
        
        const parts = timeString.split(':');
        if (parts.length === 3) {
            return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
        }
        return 0;
    }

    // Formata recursos para exibição
    formatResources(resources) {
        if (!resources) return '0/0/0/0/0';
        
        const { wood = 0, wine = 0, marble = 0, glass = 0, sulfur = 0 } = resources;
        return `${this.formatNumber(wood)}/${this.formatNumber(wine)}/${this.formatNumber(marble)}/${this.formatNumber(glass)}/${this.formatNumber(sulfur)}`;
    }

    // Formata números grandes
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'k';
        }
        return num.toString();
    }

    // Calcula tempo desde última espionagem
    getTimeSince(lastSpyTime) {
        if (!lastSpyTime) return 'Nunca';
        
        const now = Date.now();
        const diff = now - lastSpyTime;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);
        
        if (days > 0) {
            return `${days}d ${hours % 24}h`;
        } else if (hours > 0) {
            return `${hours}h`;
        } else {
            const minutes = Math.floor(diff / (1000 * 60));
            return `${minutes}m`;
        }
    }

    // Gera o HTML da tabela de espionagem
    generateEspionageTable() {
        const espionageData = this.getEspionageData();
        const { targets } = espionageData;

        if (targets.length === 0) {
            return '<div class="espionage-empty">Nenhum alvo de espionagem disponível</div>';
        }

        // Cabeçalho da tabela
        let html = '<table class="espionage-overview-table">';
        html += '<thead><tr>';
        html += '<th class="city-name">Cidade</th>';
        html += '<th class="player-name">Jogador</th>';
        html += '<th class="alliance-name">Aliança</th>';
        html += '<th class="building-levels">Prédios</th>';
        html += '<th class="travel-time">Tempo</th>';
        html += '<th class="resources-lootable">Saqueável</th>';
        html += '<th class="resources-looted">Saqueado</th>';
        html += '<th class="military-info">Militar</th>';
        html += '<th class="location">Local</th>';
        html += '<th class="last-spy">Última Esp.</th>';
        html += '<th class="actions">Ações</th>';
        html += '</tr></thead><tbody>';

        // Linhas dos alvos
        targets.forEach(target => {
            html += '<tr>';
            
            // Nome da cidade com indicadores de status
            let cityName = target.name;
            let cityClass = `player-state-${target.playerState}`;
            
            if (target.occupiedBy) {
                cityName += ' 🏴';
            }
            if (target.blockadedBy) {
                cityName += ' ⚓';
            }
            
            html += `<td class="city-name ${cityClass}">${cityName}</td>`;
            
            // Jogador
            html += `<td class="player-name">${target.player}</td>`;
            
            // Aliança
            html += `<td class="alliance-name">${target.alliance}</td>`;
            
            // Níveis de prédios (Prefeitura/Muralha)
            html += `<td class="building-levels">${target.townHallLevel}/${target.wallLevel}</td>`;
            
            // Tempo de viagem
            html += `<td class="travel-time">${target.travelTime}</td>`;
            
            // Recursos saqueáveis
            html += `<td class="resources-lootable">${this.formatResources(target.resources.lootable)}</td>`;
            
            // Recursos saqueados
            html += `<td class="resources-looted">${this.formatResources(target.resources.looted)}</td>`;
            
            // Informações militares
            html += `<td class="military-info">${target.combats}/${this.formatNumber(target.militaryScore)}</td>`;
            
            // Localização
            html += `<td class="location">[${target.location.x}:${target.location.y}]</td>`;
            
            // Última espionagem
            html += `<td class="last-spy">${this.getTimeSince(target.lastSpyTime)}</td>`;
            
            // Ações
            html += '<td class="actions">';
            html += `<a href="#" class="action-link" data-action="spy" data-target="${target.id}">Espionar</a> `;
            html += `<a href="#" class="action-link" data-action="attack" data-target="${target.id}">Atacar</a> `;
            html += `<a href="#" class="action-link" data-action="pillage" data-target="${target.id}">Saquear</a> `;
            html += `<a href="#" class="action-link" data-action="remove" data-target="${target.id}">Remover</a>`;
            html += '</td>';
            
            html += '</tr>';
        });

        html += '</tbody></table>';
        
        // Resumo
        html += `<div class="espionage-summary">Total de alvos: ${targets.length}</div>`;
        
        return html;
    }

    // Gera o CSS para a tabela de espionagem
    generateEspionageCSS() {
        return `
            .espionage-overview-table {
                width: 100%;
                border-collapse: collapse;
                font-size: 11px;
            }
            
            .espionage-overview-table th,
            .espionage-overview-table td {
                border: 1px solid #ccc;
                padding: 3px 5px;
                text-align: center;
            }
            
            .espionage-overview-table th {
                background-color: #f0f0f0;
                font-weight: bold;
                font-size: 10px;
            }
            
            .espionage-overview-table .city-name {
                text-align: left;
                font-weight: bold;
                min-width: 100px;
            }
            
            .espionage-overview-table .player-name {
                min-width: 80px;
            }
            
            .espionage-overview-table .alliance-name {
                min-width: 60px;
            }
            
            .espionage-overview-table .building-levels {
                min-width: 50px;
            }
            
            .espionage-overview-table .travel-time {
                min-width: 60px;
            }
            
            .espionage-overview-table .resources-lootable,
            .espionage-overview-table .resources-looted {
                min-width: 80px;
                font-size: 10px;
            }
            
            .espionage-overview-table .military-info {
                min-width: 60px;
            }
            
            .espionage-overview-table .location {
                min-width: 60px;
            }
            
            .espionage-overview-table .last-spy {
                min-width: 70px;
            }
            
            .espionage-overview-table .actions {
                min-width: 120px;
            }
            
            .espionage-overview-table .action-link {
                color: #0066cc;
                text-decoration: none;
                font-size: 9px;
                margin: 0 1px;
            }
            
            .espionage-overview-table .action-link:hover {
                text-decoration: underline;
            }
            
            .espionage-overview-table .player-state-inactive {
                color: #999;
            }
            
            .espionage-overview-table .player-state-vacation {
                color: #0066cc;
            }
            
            .espionage-overview-table .player-state-banned {
                color: #cc0000;
            }
            
            .espionage-summary {
                margin-top: 10px;
                padding: 5px;
                background-color: #f9f9f9;
                border: 1px solid #ddd;
                text-align: center;
                font-size: 12px;
                font-weight: bold;
            }
            
            .espionage-empty {
                text-align: center;
                padding: 20px;
                color: #666;
            }
        `;
    }

    // Método principal para renderizar a aba de espionagem
    render() {
        const tableHTML = this.generateEspionageTable();
        const css = this.generateEspionageCSS();
        
        return {
            html: `
                <div class="espionage-tab-content">
                    <style>${css}</style>
                    ${tableHTML}
                </div>
            `,
            data: this.getEspionageData()
        };
    }
}

export default EspionageTpl;

