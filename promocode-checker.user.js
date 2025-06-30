// ==UserScript==
// @name        Promocode Checker - Item Discounts (Div Table, Stable)
// @namespace   http://tampermonkey.net/
// @version     2.0
// @description Проверяет промокоды и показывает скидки по каждому промокоду на каждый товар в табличном виде (без тега table). Улучшена стабильность.
// @author      Человек
// @match       https://www.21vek.by/*
// @grant       none
// @updateURL   https://raw.githubusercontent.com/dzmitry-masko/promocode-checker/main/promocode-checker.user.js
// @downloadURL https://raw.githubusercontent.com/dzmitry-masko/promocode-checker/repo/main/promocode-checker.user.js
// ==/UserScript==

(function() {
    'use strict';

    // Функция для инициализации элементов интерфейса
    function initializeUI() {
        console.log('initializeUI: Запуск функции.');

        // Проверяем, существует ли уже контейнер, чтобы избежать дублирования
        if (document.getElementById('promocodeCheckerContainer')) {
            console.log('initializeUI: Контейнер уже существует, выход.');
            return;
        }

        // Убедимся, что body существует перед добавлением элементов
        if (!document.body) {
            console.error('initializeUI: document.body не найден. Откладываем инициализацию.');
            setTimeout(initializeUI, 500); // Повторная попытка через 0.5 секунды
            return;
        }

        console.log('initializeUI: Создание элементов UI...');

        const container = document.createElement('div');
        container.id = 'promocodeCheckerContainer'; // Добавляем ID для удобства проверки
        container.style.position = 'fixed';
        container.style.bottom = '10px';
        container.style.right = '10px';
        container.style.width = 'fit-content';
        container.style.maxWidth = '90vw';
        container.style.maxHeight = '600px';
        container.style.overflowY = 'auto';
        container.style.overflowX = 'auto';
        container.style.backgroundColor = 'white';
        container.style.border = '2px solid #333';
        container.style.padding = '10px';
        container.style.zIndex = 100000;
        container.style.fontFamily = 'Arial, sans-serif';
        container.style.fontSize = '14px';
        container.style.boxShadow = '0 0 10px rgba(0,0,0,0.3)';

        const headerDiv = document.createElement('div');
        headerDiv.style.display = 'flex';
        headerDiv.style.justifyContent = 'space-between';
        headerDiv.style.alignItems = 'center';
        headerDiv.style.marginBottom = '10px';

        const btn = document.createElement('button');
        btn.textContent = 'Проверить промокоды';
        btn.style.flexGrow = '1';
        btn.style.padding = '8px';
        btn.style.fontSize = '16px';
        btn.style.cursor = 'pointer';
        btn.style.marginRight = '10px'; // Add some space to the right of the button

        const toggleButton = document.createElement('button');
        toggleButton.textContent = 'Свернуть';
        toggleButton.style.padding = '5px 10px';
        toggleButton.style.fontSize = '14px';
        toggleButton.style.cursor = 'pointer';
        toggleButton.style.display = 'none'; // Initially hide the toggle button

        const output = document.createElement('div');
        output.id = 'promocodeCheckerOutput'; // Добавляем ID для выходного блока
        output.style.whiteSpace = 'pre-wrap';
        output.style.maxHeight = '520px';
        output.style.overflowY = 'auto';
        output.style.border = '1px solid #ccc';
        output.style.padding = '8px';
        output.style.backgroundColor = '#f9f9f9';

        headerDiv.appendChild(btn);
        headerDiv.appendChild(toggleButton);
        container.appendChild(headerDiv);
        container.appendChild(output);

        console.log('initializeUI: Попытка добавить кнопку и вывод в контейнер...');

        console.log('initializeUI: Попытка добавить контейнер в body...');
        document.body.appendChild(container);
        console.log('initializeUI: Элементы UI успешно добавлены.');

        // Functionality for toggle button
        let isMinimized = false;
        const initialMaxHeight = container.style.maxHeight;
        const initialOverflowY = container.style.overflowY;

        toggleButton.addEventListener('click', () => {
            if (isMinimized) {
                container.style.maxHeight = initialMaxHeight;
                container.style.overflowY = initialOverflowY;
                output.style.display = 'block';
                toggleButton.textContent = 'Свернуть';
            } else {
                container.style.maxHeight = '50px'; // Adjust to fit the header and button
                container.style.overflowY = 'hidden';
                output.style.display = 'none';
                toggleButton.textContent = 'Развернуть';
            }
            isMinimized = !isMinimized;
        });


        // Множество промокодов, без дубликатов
        const promocodesSet = new Set([
            "2КОЛЕСА", "ADMITAD15", "ADMITAD2", "ADMITAD23", "APPADMITAD50", "APPADMITAD9",
            "АРКА", "АТЛАС", "АВТО", "БАГАЖ", "БАЛИ", "БАРАБАН", "БИЗНЕС", "БИЦЕПС", "БРУС",
            "ВЕЛОМИГ", "ВЕСЛО", "ВИЗИТ", "ВКУСНО", "ВОДИТЕЛЬ", "ВОДНЫЙ", "ВОДОПРОВОД",
            "ВОДЯНОЙ", "ВОЯЖ", "ГАДЖЕТ", "ГАЗОН", "ГНОМИК", "ГРЯДКА", "ДЕКОР", "ДИАГОНАЛЬ",
            "ДОМИК", "ДУТ", "ДУХИ", "ЕРАЛАШ", "ЗВУК", "ЗЁРНО", "ЗОЖ", "КАБИНЕТ", "КАМА",
            "КАМИН", "КАНАПА", "КАПУСТА", "КАРАВАН", "КАТУШКА", "КЛИМАТ", "КЛИН", "КЛУБ",
            "КОФЕПАУЗА", "КРАСОТКА", "КРАШ", "КРЕМ", "ЛЕНТА", "ЛЮБИМЕЦ", "ЛЮКС", "ЛЮЛЬКА",
            "МАЛЮТКА", "МАНСАРДА", "МАССАЖ", "МИО", "МОНАМИ", "МУРЗИК", "МЯТА", "НАДОМ",
            "НЕЖНО", "НЕДЕЛЯ", "НОВОСЕЛЬЕ", "ОБНОВЛЕНИЕ", "ОБОИ", "ОБУСТРОЙСТВО", "ОГОРОД",
            "ОПС", "ОРГАНАЙЗЕР", "ОТДЕЛКА", "ПАНАМА", "ПАРИЖ", "ПИЖАМА", "ПИКОДИ",
            "ПИНГВИН", "ПЛАН", "ПЛАФОН", "ПЛИТА", "ПОГОДА", "ПОМОЩНИК", "ПОРТАТИВ", "ПУПС",
            "ПУШИСТИК", "ПЯТЬ", "РЕБУС", "РЕКОРД", "РОЛЛЕР", "САПСАН", "СВЯЗЬ", "СЕЙЧАС",
            "СЕРВАНТ", "СЕРВЕР", "СЕРВИЗ", "СИЯТЬ", "СНЕГ", "СОВЕТ", "СПА", "СПЛИТ", "СТУДЕНЬ",
            "СУББОТНИК", "СУПЕРТВ", "ТАБМЕТ", "ТАРИФ", "ТАРЕЛКА", "ТЕСЛА", "ТЕХНИКА", "ТОНИК",
            "ТРЕНД", "ТРИ", "ТУРНИК", "УБОРКА", "УБОРНАЯ", "УДОБСТВО", "УТЮГ", "ФАЗЕНДА",
            "ФАСАД", "ФОН", "ФОРТУНА", "ФОТОН", "ХВОСТИК", "ХИТ", "ХОББИ", "ХОРОШО", "ЧАЙНИК",
            "ЧЕСНОК", "ЧТИВО", "ШАНС", "ШАР", "ШКОЛА", "ЭЛЕКТРОНИКА", "ЮЛА"
        ]);

        // Случайный порядок промокодов
        const promocodes = Array.from(promocodesSet).sort(() => Math.random() - 0.5);

        function sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        // Функция для получения текущих данных корзины
        async function getCartData() {
            const response = await fetch("https://gate.21vek.by/cart/carts", {
                method: "GET",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json" // Удаляем, так как это GET запрос и может вызывать 415
                },
                credentials: "include"
            });
            if (response.status === 415) {
                console.error('Ошибка 415 Unsupported Media Type при получении данных корзины. Попробуйте удалить Content-Type из GET запроса.');
                throw new Error(`Ошибка 415 Unsupported Media Type при получении данных корзины.`);
            }
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        }

        async function checkPromocodes() {
            btn.disabled = true;
            btn.style.display = 'none'; // Hide the button after click
            toggleButton.style.display = 'block'; // Show the toggle button after click
            output.innerHTML = 'Начинаем проверку промокодов...\n\n';

            const resultsTableData = {};
            const allItemNames = new Set();
            const failedPromocodes = [];

            let initialCartData;
            try {
                initialCartData = await getCartData();
            } catch (error) {
                output.innerHTML += `<p style="color: red;">Ошибка при получении данных корзины: ${error.message}</p>`;
                btn.disabled = false;
                btn.style.display = 'block'; // Show button if there's an error
                toggleButton.style.display = 'none'; // Hide toggle button if there's an error
                return;
            }

            const initialItems = {};
            if (initialCartData && initialCartData.data && initialCartData.data.items) {
                initialCartData.data.items.forEach(item => {
                    initialItems[item.id] = {
                        name: item.name,
                        initialSalePrice: item.prices.salePrice,
                        initialPrice: item.prices.price
                    };
                    allItemNames.add(item.name);
                });
                output.innerHTML += `<p>Найдено товаров в корзине: ${Object.keys(initialItems).length}</p>`;
            } else {
                output.innerHTML += `<p style="color: orange;">Внимание: Товары в корзине не найдены. Скидки на отдельные товары не будут проверяться.</p>`;
                btn.disabled = false;
                btn.style.display = 'block'; // Show button if no items
                toggleButton.style.display = 'none'; // Hide toggle button if no items
                return;
            }

            for (const code of promocodes) {
                output.innerHTML += `Проверяем: <b>${code}</b> ...<br>`;
                output.scrollTop = output.scrollHeight;

                try {
                    const response = await fetch("https://gate.21vek.by/cart/carts/promo-codes", {
                        method: "POST",
                        headers: {
                            "Accept": "application/json",
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({ promocode: code }),
                        credentials: "include"
                    });

                    if (response.status === 409) {
                        const data = await response.json();
                        const reason = data.errors?.[0]?.title || "Конфликт (409)";
                        failedPromocodes.push({ code, reason });
                        output.innerHTML += `&nbsp; <span style="color: red;">Ошибка 409: ${reason}</span><br><br>`;
                    } else if (response.status === 406) {
                        failedPromocodes.push({ code, reason: "Код не подходит (406)" });
                        output.innerHTML += `&nbsp; <span style="color: red;">Ошибка 406: код не подходит</span><br><br>`;
                    } else if (!response.ok) {
                        const text = await response.text();
                        failedPromocodes.push({ code, reason: `HTTP ошибка: ${response.status}, тело ответа: ${text}` });
                        output.innerHTML += `&nbsp; <span style="color: red;">HTTP ошибка ${response.status}: ${text}</span><br><br>`;
                    } else {
                        const data = await response.json();
                        if (data.errors?.length) {
                            failedPromocodes.push({ code, reason: data.errors[0].title });
                            output.innerHTML += `&nbsp; <span style="color: red;">Ошибка API: ${data.errors[0].title}</span><br><br>`;
                        } else {
                            const totalDiscount = data.data?.totals?.items?.discount || 0;
                            const promoItemDiscounts = {};
                            let foundItemDiscount = false;

                            const updatedCartData = await getCartData();
                            if (updatedCartData && updatedCartData.data && updatedCartData.data.items) {
                                updatedCartData.data.items.forEach(updatedItem => {
                                    const initialItem = initialItems[updatedItem.id];
                                    if (initialItem) {
                                        const discount = initialItem.initialPrice - updatedItem.prices.salePrice;
                                        if (discount > 0.01 && updatedItem.prices.salePrice > 0) {
                                            promoItemDiscounts[initialItem.name] = discount.toFixed(2);
                                            foundItemDiscount = true;
                                        } else {
                                            promoItemDiscounts[initialItem.name] = "0.00";
                                        }
                                    }
                                });

                                if (totalDiscount > 0.01 || foundItemDiscount) {
                                    resultsTableData[code] = {
                                        itemDiscounts: promoItemDiscounts,
                                        totalDiscount: totalDiscount
                                    };
                                    output.innerHTML += `&nbsp; <span style="color: green;">Успешно! Общая скидка: ${totalDiscount.toFixed(2)} BYN</span><br>`;
                                    if (Object.keys(promoItemDiscounts).length > 0) {
                                        output.innerHTML += `&nbsp;&nbsp;&nbsp;Скидки на товары:<br>`;
                                        for (const itemName in promoItemDiscounts) {
                                            output.innerHTML += `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;- ${itemName}: ${promoItemDiscounts[itemName]} BYN<br>`;
                                        }
                                    }
                                    output.innerHTML += `<br>`;
                                } else {
                                    output.innerHTML += `&nbsp; <span style="color: gray;">Промокод применён, но скидки на отдельные товары или общая скидка не обнаружены.</span><br><br>`;
                                }

                            } else {
                                output.innerHTML += `&nbsp; <span style="color: orange;">Внимание: Не удалось получить обновленные данные корзины после применения промокода.</span><br><br>`;
                            }

                            await fetch("https://gate.21vek.by/cart/carts/promocode.delete", {
                                method: "POST",
                                headers: {
                                    "Accept": "application/json",
                                    "Content-Type": "application/json"
                                },
                                body: JSON.stringify({ promocode: code }),
                                credentials: "include"
                            });
                        }
                    }
                } catch (error) {
                    failedPromocodes.push({ code, reason: `Ошибка запроса: ${error.message}` });
                    output.innerHTML += `&nbsp; <span style="color: red;">Ошибка запроса: ${error.message}</span><br><br>`;
                }

                output.scrollTop = output.scrollHeight;

                const delay = 3000 + Math.floor(Math.random() * 7000);
                await sleep(delay);
            }

            output.innerHTML += `<hr><h3>Проверка завершена.</h3>`;

            const validPromocodesForTable = Object.keys(resultsTableData);

            if (validPromocodesForTable.length > 0) {
                output.innerHTML += `<h4>Сводная таблица скидок по промокодам и товарам:</h4>`;

                // Define consistent column widths
                const promoCodeColumnWidth = '120px';
                const itemColumnWidth = '180px'; // Increased slightly to better accommodate wrapped text

                // Создаем контейнер для таблицы на основе div
                const divTable = document.createElement('div');
                divTable.style.border = '1px solid #ccc';
                divTable.style.display = 'flex';
                divTable.style.flexDirection = 'column';
                divTable.style.width = '100%';
                divTable.style.minWidth = 'fit-content';
                divTable.style.overflowX = 'auto'; // Для горизонтального скролла
                divTable.style.boxSizing = 'border-box'; // Учитываем padding и border в ширине

                // Заголовки (первый ряд)
                const headerRow = document.createElement('div');
                headerRow.style.display = 'flex';
                headerRow.style.fontWeight = 'bold';
                headerRow.style.backgroundColor = '#f0f0f0';
                headerRow.style.borderBottom = '1px solid #ccc';
                headerRow.style.minHeight = '50px'; // Increased height for wrapped text
                headerRow.style.alignItems = 'center'; // Vertically center text

                const promoHeaderCell = document.createElement('div');
                promoHeaderCell.textContent = 'Промокод';
                promoHeaderCell.style.width = promoCodeColumnWidth; // Use fixed width
                promoHeaderCell.style.flexShrink = 0; // Prevent shrinking
                promoHeaderCell.style.flexGrow = 0; // Prevent growing
                promoHeaderCell.style.padding = '5px';
                promoHeaderCell.style.borderRight = '1px solid #ccc';
                promoHeaderCell.style.textAlign = 'center';
                promoHeaderCell.style.wordBreak = 'break-word'; // Ensure text breaks
                headerRow.appendChild(promoHeaderCell);

                const sortedItemNames = Array.from(allItemNames).sort();
                sortedItemNames.forEach(itemName => {
                    const itemHeaderCell = document.createElement('div');
                    itemHeaderCell.textContent = itemName;
                    itemHeaderCell.style.width = itemColumnWidth; // Use fixed width
                    itemHeaderCell.style.flexShrink = 0; // Prevent shrinking
                    itemHeaderCell.style.flexGrow = 0; // Prevent growing
                    itemHeaderCell.style.padding = '5px';
                    itemHeaderCell.style.borderRight = '1px solid #ccc';
                    itemHeaderCell.style.textAlign = 'center';
                    itemHeaderCell.style.wordBreak = 'break-word'; // Ensure text breaks
                    itemHeaderCell.style.overflow = 'hidden'; // Hide overflow if it somehow occurs
                    headerRow.appendChild(itemHeaderCell);
                });
                divTable.appendChild(headerRow);

                // Ряды данных
                validPromocodesForTable.forEach(code => {
                    const promoData = resultsTableData[code];
                    const dataRow = document.createElement('div');
                    dataRow.style.display = 'flex';
                    dataRow.style.borderBottom = '1px solid #eee';
                    dataRow.style.minHeight = '50px'; // Ensure consistent row height
                    dataRow.style.alignItems = 'center'; // Vertically center text

                    const promoCodeCell = document.createElement('div');
                    promoCodeCell.style.width = promoCodeColumnWidth; // Apply same fixed width
                    promoCodeCell.style.flexShrink = 0;
                    promoCodeCell.style.flexGrow = 0;
                    promoCodeCell.style.padding = '5px';
                    promoCodeCell.style.borderRight = '1px solid #ccc';
                    promoCodeCell.style.textAlign = 'center';
                    promoCodeCell.style.wordBreak = 'break-word';

                    // --- START OF MODIFICATION ---
                    // Add promocode text
                    promoCodeCell.innerHTML = `<b>${code}</b>`;

                    // Create copy icon element
                    const copyIcon = document.createElement('span');
                    copyIcon.innerHTML = ' 🔗'; // Clipboard icon
                    copyIcon.style.cursor = 'pointer';
                    copyIcon.style.marginLeft = '5px';
                    copyIcon.title = `Копировать "${code}"`;

                    copyIcon.addEventListener('click', async (event) => {
                        event.stopPropagation(); // Prevent potential parent clicks
                        try {
                            await navigator.clipboard.writeText(code);
                            copyIcon.textContent = ' ✅'; // Change to checkmark on success
                            setTimeout(() => {
                                copyIcon.innerHTML = ' 🔗'; // Revert after a delay
                            }, 1500);
                        } catch (err) {
                            console.error('Не удалось скопировать текст: ', err);
                            copyIcon.textContent = ' ❌'; // Show error icon
                            setTimeout(() => {
                                copyIcon.innerHTML = ' 🔗'; // Revert after a delay
                            }, 1500);
                        }
                    });
                    promoCodeCell.appendChild(copyIcon);
                    // --- END OF MODIFICATION ---

                    dataRow.appendChild(promoCodeCell);

                    sortedItemNames.forEach(itemName => {
                        const itemDiscountCell = document.createElement('div');
                        const discount = parseFloat(promoData.itemDiscounts[itemName]); // Преобразуем в число для сравнения
                        const displayDiscount = discount.toFixed(2); // Форматируем обратно для отображения

                        itemDiscountCell.textContent = `${displayDiscount} BYN`;
                        // Добавляем стили для выделения ненулевой скидки
                        if (discount > 0) {
                            itemDiscountCell.style.fontWeight = 'bold';
                            itemDiscountCell.style.color = '#007000'; // Темно-зеленый
                            itemDiscountCell.style.backgroundColor = '#e6ffe6'; // Светло-зеленый фон
                        }

                        itemDiscountCell.style.width = itemColumnWidth; // Apply same fixed width
                        itemDiscountCell.style.flexShrink = 0;
                        itemDiscountCell.style.flexGrow = 0;
                        itemDiscountCell.style.padding = '5px';
                        itemDiscountCell.style.borderRight = '1px solid #ccc';
                        itemDiscountCell.style.textAlign = 'center';
                        itemDiscountCell.style.wordBreak = 'break-word';
                        dataRow.appendChild(itemDiscountCell);
                    });
                    divTable.appendChild(dataRow);
                });
                output.appendChild(divTable); // Добавляем созданную div-таблицу в output

            } else {
                output.innerHTML += `<p>Не найдено ни одного промокода, дающего скидку на отдельные товары в корзине или общую скидку.</p>`;
            }

            if (failedPromocodes.length > 0) {
                output.innerHTML += `<h4>Неудачные промокоды (не применены):</h4>`;
                // Для списка неудачных промокодов также используем div-элементы
                const failedDivList = document.createElement('div');
                failedDivList.style.border = '1px solid #ccc';
                failedDivList.style.display = 'flex';
                failedDivList.style.flexDirection = 'column';
                failedDivList.style.width = '100%';
                failedDivList.style.boxSizing = 'border-box';

                const failedHeaderRow = document.createElement('div');
                failedHeaderRow.style.display = 'flex';
                failedHeaderRow.style.fontWeight = 'bold';
                failedHeaderRow.style.backgroundColor = '#f0f0f0';
                failedHeaderRow.style.borderBottom = '1px solid #ccc';
                failedHeaderRow.style.minHeight = '30px';
                failedHeaderRow.style.lineHeight = '30px';

                const failedPromoHeader = document.createElement('div');
                failedPromoHeader.textContent = 'Промокод';
                failedPromoHeader.style.flex = '1';
                failedPromoHeader.style.padding = '5px';
                failedPromoHeader.style.borderRight = '1px solid #ccc';
                failedPromoHeader.style.textAlign = 'center';
                failedHeaderRow.appendChild(failedPromoHeader);

                const failedReasonHeader = document.createElement('div');
                failedReasonHeader.textContent = 'Причина';
                failedReasonHeader.style.flex = '2';
                failedReasonHeader.style.padding = '5px';
                failedReasonHeader.style.textAlign = 'center';
                failedHeaderRow.appendChild(failedReasonHeader);
                failedDivList.appendChild(failedHeaderRow);

                failedPromocodes.forEach(f => {
                    const failedDataRow = document.createElement('div');
                    failedDataRow.style.display = 'flex';
                    failedDataRow.style.borderBottom = '1px solid #eee';
                    failedDataRow.style.minHeight = '30px';
                    failedDataRow.style.lineHeight = '30px';

                    const failedPromoCell = document.createElement('div');
                    failedPromoCell.textContent = f.code;
                    failedPromoCell.style.flex = '1';
                    failedPromoCell.style.padding = '5px';
                    failedPromoCell.style.borderRight = '1px solid #ccc';
                    failedPromoCell.style.textAlign = 'center';
                    failedDataRow.appendChild(failedPromoCell);

                    const failedReasonCell = document.createElement('div');
                    failedReasonCell.textContent = f.reason;
                    failedReasonCell.style.flex = '2';
                    failedReasonCell.style.padding = '5px';
                    failedReasonCell.style.textAlign = 'center';
                    failedDataRow.appendChild(failedReasonCell);
                    failedDivList.appendChild(failedDataRow);
                });
                output.appendChild(failedDivList);
            }

            // btn.disabled = false; // The button remains hidden
        }

        btn.addEventListener('click', checkPromocodes);
    }

    // --- Инициализация скрипта ---
    // 1. Пытаемся запустить после полной загрузки DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeUI);
    } else {
        initializeUI();
    }

    // 2. Дополнительная проверка и запуск через короткое время, если DOMContentLoaded пропущен или не сработал
    setTimeout(() => {
        if (!document.getElementById('promocodeCheckerContainer')) {
            console.log('Таймаут: Контейнер не найден, повторная инициализация UI.');
            initializeUI();
        } else {
            console.log('Таймаут: Контейнер уже существует, повторная инициализация не нужна.');
        }
    }, 1500); // Увеличил задержку до 1.5 секунды на всякий случай

})();
