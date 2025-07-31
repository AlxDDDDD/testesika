import Parent from '../../../_dummy.js';

class MilitaryTpl extends Parent {
    constructor(data) {
        super(data);
        this.data = data;
        this.cities = data.cities || {};
        this.movements = data.movements || [];
    }

    // Coleta dados militares de todas as cidades
    getMilitaryData() {
        const militaryData = {};
        const unitTypes = new Set();

        // Itera sobre todas as cidades para coletar dados militares
        Object.values(this.cities).forEach(city => {
            if (!city.id) return;
            
            militaryData[city.id] = {
                name: city.name,
                actionPoints: city.actionPoints || 0,
                units: {},
                training: {},
                deploying: {},
                plundering: {}
            };

            // Unidades presentes na cidade
            if (city.military && city.military.units) {
                Object.entries(city.military.units).forEach(([unitType, count]) => {
                    if (count > 0) {
                        unitTypes.add(unitType);
                        militaryData[city.id].units[unitType] = count;
                    }
                });
            }

            // Unidades em treinamento
            if (city.military && city.military.training) {
                Object.entries(city.military.training).forEach(([unitType, batches]) => {
                    if (batches && batches.length > 0) {
                        unitTypes.add(unitType);
                        militaryData[city.id].training[unitType] = batches.reduce((total, batch) => {
                            return total + (batch.count || 0);
                        }, 0);
                    }
                });
            }
        });

        // Processa movimentos militares
        this.movements.forEach(movement => {
            if (!movement.units) return;

            const originCityId = movement.originCityId;
            const targetCityId = movement.targetCityId;
            const mission = movement.mission;
            const stage = movement.stage;

            Object.entries(movement.units).forEach(([unitType, count]) => {
                if (count <= 0) return;
                
                unitTypes.add(unitType);

                // Movimentos de deployment
                if (mission === 'deployArmy' || mission === 'deployNavy') {
                    if (stage === 'loading' || stage === 'enRoute') {
                        if (militaryData[targetCityId]) {
                            militaryData[targetCityId].deploying[unitType] = 
                                (militaryData[targetCityId].deploying[unitType] || 0) + count;
                        }
                    } else if (stage === 'returning') {
                        if (militaryData[originCityId]) {
                            militaryData[originCityId].deploying[unitType] = 
                                (militaryData[originCityId].deploying[unitType] || 0) + count;
                        }
                    }
                }

                // Movimentos de pilhagem
                if (mission === 'plunder') {
                    if (militaryData[originCityId]) {
                        militaryData[originCityId].plundering[unitType] = 
                            (militaryData[originCityId].plundering[unitType] || 0) + count;
                    }
                }
            });
        });

        return {
            cities: militaryData,
            unitTypes: Array.from(unitTypes).sort()
        };
    }

    // Gera o HTML da tabela militar
    generateMilitaryTable() {
        const militaryData = this.getMilitaryData();
        const { cities, unitTypes } = militaryData;

        if (Object.keys(cities).length === 0) {
            return '<div class="military-empty">Nenhum dado militar disponível</div>';
        }

        // Cabeçalho da tabela
        let html = '<table class="military-overview-table">';
        html += '<thead><tr>';
        html += '<th class="city-name">Cidade</th>';
        html += '<th class="action-points">PA</th>';
        html += '<th class="actions">Ações</th>';
        
        // Cabeçalhos das unidades
        unitTypes.forEach(unitType => {
            const unitName = this.getUnitName(unitType);
            html += `<th class="unit-${unitType}" title="${unitName}">${unitName}</th>`;
        });
        
        html += '</tr></thead><tbody>';

        // Linhas das cidades
        Object.values(cities).forEach(city => {
            html += '<tr>';
            html += `<td class="city-name">${city.name}</td>`;
            html += `<td class="action-points">${city.actionPoints}</td>`;
            html += '<td class="actions">';
            html += `<a href="#" class="action-link" data-action="barracks" data-city="${city.name}">Quartel</a> `;
            html += `<a href="#" class="action-link" data-action="shipyard" data-city="${city.name}">Estaleiro</a>`;
            html += '</td>';

            // Células das unidades
            unitTypes.forEach(unitType => {
                const present = city.units[unitType] || 0;
                const training = city.training[unitType] || 0;
                const deploying = city.deploying[unitType] || 0;
                const plundering = city.plundering[unitType] || 0;

                let cellContent = present.toString();
                let cellClass = `unit-${unitType}`;
                let tooltip = `${this.getUnitName(unitType)}: ${present}`;

                if (training > 0) {
                    cellContent += ` (+${training})`;
                    tooltip += `\nTreinando: ${training}`;
                    cellClass += ' has-training';
                }

                if (deploying > 0) {
                    cellContent += ` [${deploying}]`;
                    tooltip += `\nMovimentando: ${deploying}`;
                    cellClass += ' has-deploying';
                }

                if (plundering > 0) {
                    cellContent += ` {${plundering}}`;
                    tooltip += `\nSaqueando: ${plundering}`;
                    cellClass += ' has-plundering';
                }

                html += `<td class="${cellClass}" title="${tooltip}">${cellContent}</td>`;
            });

            html += '</tr>';
        });

        html += '</tbody></table>';
        return html;
    }

    // Obtém o nome da unidade (pode ser expandido com localização)
    getUnitName(unitType) {
        const unitNames = {
            'phalanx': 'Hoplita',
            'steamgiant': 'Gigante a Vapor',
            'spearman': 'Lanceiro',
            'swordsman': 'Espadachim',
            'slinger': 'Fundeiro',
            'archer': 'Arqueiro',
            'marksman': 'Carabineiro',
            'ram': 'Aríete',
            'catapult': 'Catapulta',
            'mortar': 'Morteiro',
            'gyrocopter': 'Girocóptero',
            'bombardier': 'Bombardeiro',
            'cook': 'Cozinheiro',
            'medic': 'Médico',
            'ship_ram': 'Navio Aríete',
            'ship_flamethrower': 'Navio Lança-chamas',
            'ship_steamboat': 'Navio a Vapor',
            'ship_ballista': 'Navio Balista',
            'ship_catapult': 'Navio Catapulta',
            'ship_mortar': 'Navio Morteiro',
            'ship_submarine': 'Submarino',
            'ship_paddlespeedship': 'Navio Rápido',
            'ship_ballooncarrier': 'Porta-balões',
            'ship_tender': 'Navio de Apoio',
            'ship_rocketship': 'Navio Foguete'
        };

        return unitNames[unitType] || unitType;
    }

    // Gera o CSS para a tabela militar
    generateMilitaryCSS() {
        return `
            .military-overview-table {
                width: 100%;
                border-collapse: collapse;
                font-size: 12px;
            }
            
            .military-overview-table th,
            .military-overview-table td {
                border: 1px solid #ccc;
                padding: 4px 6px;
                text-align: center;
            }
            
            .military-overview-table th {
                background-color: #f0f0f0;
                font-weight: bold;
            }
            
            .military-overview-table .city-name {
                text-align: left;
                font-weight: bold;
                min-width: 120px;
            }
            
            .military-overview-table .action-points {
                min-width: 30px;
            }
            
            .military-overview-table .actions {
                min-width: 100px;
            }
            
            .military-overview-table .action-link {
                color: #0066cc;
                text-decoration: none;
                font-size: 10px;
                margin: 0 2px;
            }
            
            .military-overview-table .action-link:hover {
                text-decoration: underline;
            }
            
            .military-overview-table .has-training {
                background-color: #e6f3ff;
            }
            
            .military-overview-table .has-deploying {
                background-color: #fff2e6;
            }
            
            .military-overview-table .has-plundering {
                background-color: #ffe6e6;
            }
            
            .military-empty {
                text-align: center;
                padding: 20px;
                color: #666;
            }
        `;
    }

    // Método principal para renderizar a aba militar
    render() {
        const tableHTML = this.generateMilitaryTable();
        const css = this.generateMilitaryCSS();
        
        return {
            html: `
                <div class="military-tab-content">
                    <style>${css}</style>
                    ${tableHTML}
                </div>
            `,
            data: this.getMilitaryData()
        };
    }
}

export default MilitaryTpl;

