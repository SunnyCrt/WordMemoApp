/**
 * App Logic for Word Memo (Mobile V2)
 */
document.addEventListener('DOMContentLoaded', () => {
    // State
    let currentFolderId = 'all';
    let currentSort = 'created';
    let selectedWordIds = new Set();
    let isSelectionMode = false;
    let searchResults = [];
    let currentSearchIndex = -1;
    let longPressTimer = null;
    let editingWordId = null;

    // Elements
    const elements = {
        folderSelectBtn: document.getElementById('folder-select-btn'),
        currentFolderName: document.getElementById('current-folder-name'),
        folderDropdown: document.getElementById('folder-dropdown'),
        folderListItems: document.getElementById('folder-list-items'),
        wordCount: document.getElementById('word-count'),
        wordChipsContainer: document.getElementById('word-chips-container'),
        addWordBtn: document.getElementById('add-word-btn'),
        sortPopupBtn: document.getElementById('sort-popup-btn'),
        searchPopupBtn: document.getElementById('search-popup-btn'),
        moreMenuBtn: document.getElementById('more-menu-btn'),
        selectionBar: document.getElementById('selection-action-bar'),
        selectedCountText: document.getElementById('selected-count'),
        modalOverlay: document.getElementById('modal-overlay'),
        wordModal: document.getElementById('word-modal'),
        folderModal: document.getElementById('folder-modal'),
        searchModal: document.getElementById('search-modal'),
        sortMenu: document.getElementById('sort-menu'),
        moreMenu: document.getElementById('more-menu'),
        deleteModal: document.getElementById('delete-modal'),
        wordInput: document.getElementById('word-input'),
        folderInput: document.getElementById('folder-input'),
        searchInput: document.getElementById('search-input')
    };

    /**
     * Initialization
     */
    function init() {
        renderFolders();
        renderWords();
        setupEventListeners();
    }

    /**
     * Rendering
     */
    function renderFolders() {
        const folders = storage.getFolders();
        elements.folderListItems.innerHTML = '';

        folders.forEach(folder => {
            const btn = document.createElement('button');
            btn.className = 'dropdown-item';
            btn.textContent = folder.name;
            btn.onclick = (e) => {
                e.stopPropagation();
                currentFolderId = folder.id;
                elements.currentFolderName.textContent = folder.name;
                elements.folderDropdown.classList.add('hidden');
                renderWords();
            };
            elements.folderListItems.appendChild(btn);
        });

        const currentFolder = folders.find(f => f.id === currentFolderId) || folders[0];
        elements.currentFolderName.textContent = currentFolder.name;
    }

    function renderWords() {
        let words = storage.getWords();

        if (currentFolderId !== 'all') {
            words = words.filter(w => w.folderId === currentFolderId);
        }

        if (currentSort === 'asc') {
            words.sort((a, b) => a.text.localeCompare(b.text));
        } else if (currentSort === 'desc') {
            words.sort((a, b) => b.text.localeCompare(a.text));
        } else {
            words.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        elements.wordChipsContainer.innerHTML = '';
        elements.wordCount.textContent = `${words.length} words`;

        words.forEach(word => {
            const chip = document.createElement('button');
            chip.className = 'word-chip';
            chip.textContent = word.text;
            chip.style.backgroundColor = word.color;
            chip.dataset.id = word.id;

            if (selectedWordIds.has(word.id)) {
                chip.classList.add('selected');
            }

            setupWordChipEvents(chip, word);
            elements.wordChipsContainer.appendChild(chip);
        });
    }

    function setupWordChipEvents(chip, word) {
        chip.onmousedown = chip.ontouchstart = (e) => {
            longPressTimer = setTimeout(() => {
                enterSelectionMode(word.id);
            }, 600);
        };

        chip.onmouseup = chip.onmouseleave = chip.ontouchend = () => {
            clearTimeout(longPressTimer);
        };

        chip.onclick = () => {
            if (isSelectionMode) {
                toggleWordSelection(word.id);
            } else {
                openWordModal(word);
            }
        };
    }

    function enterSelectionMode(firstWordId) {
        if (isSelectionMode) return;
        isSelectionMode = true;
        selectedWordIds.clear();
        selectedWordIds.add(firstWordId);
        updateSelectionUI();
    }

    function toggleWordSelection(wordId) {
        if (selectedWordIds.has(wordId)) {
            selectedWordIds.delete(wordId);
        } else {
            selectedWordIds.add(wordId);
        }

        if (selectedWordIds.size === 0) exitSelectionMode();
        else updateSelectionUI();
    }

    function updateSelectionUI() {
        elements.selectionBar.classList.remove('hidden');
        elements.selectedCountText.textContent = `${selectedWordIds.size}개 선택됨`;
        renderWords();
    }

    function exitSelectionMode() {
        isSelectionMode = false;
        selectedWordIds.clear();
        elements.selectionBar.classList.add('hidden');
        renderWords();
    }

    function showModal(modal) {
        elements.modalOverlay.classList.remove('hidden');
        modal.classList.remove('hidden');
    }

    function hideModals() {
        elements.modalOverlay.classList.add('hidden');
        [elements.wordModal, elements.folderModal, elements.searchModal,
        elements.sortMenu, elements.moreMenu, elements.deleteModal].forEach(m => m.classList.add('hidden'));
    }

    function openWordModal(word = null) {
        editingWordId = word ? word.id : null;
        elements.wordInput.value = word ? word.text : '';
        document.getElementById('word-char-count').textContent = elements.wordInput.value.length;

        const circles = document.querySelectorAll('.color-circle');
        circles.forEach(c => {
            c.classList.toggle('selected', word ? c.dataset.color === word.color : c.dataset.color === '#e2e8f0');
        });

        const currentFolders = storage.getFolders();
        const targetFolderId = word ? word.folderId : currentFolderId;
        const targetFolder = currentFolders.find(f => f.id === targetFolderId) || currentFolders[0];
        document.getElementById('word-folder-select').textContent = `${targetFolder.name} ∨`;
        document.getElementById('word-folder-select').dataset.id = targetFolder.id;

        showModal(elements.wordModal);
        elements.wordInput.focus();
    }

    function setupEventListeners() {
        // Modal Overlay handling
        elements.modalOverlay.onclick = (e) => {
            if (e.target === elements.modalOverlay) hideModals();
        };

        // Top bar
        elements.folderSelectBtn.onclick = (e) => {
            e.stopPropagation();
            hideModals(); // Close other menus/modals

            const btnRect = elements.folderSelectBtn.getBoundingClientRect();
            const containerRect = document.querySelector('.mobile-container').getBoundingClientRect();

            elements.folderDropdown.style.top = `${btnRect.bottom - containerRect.top}px`;
            elements.folderDropdown.style.left = `${btnRect.left - containerRect.left}px`;
            elements.folderDropdown.style.width = '250px';

            elements.folderDropdown.classList.toggle('hidden');
        };

        window.onclick = () => {
            elements.folderDropdown.classList.add('hidden');
            elements.sortMenu.classList.add('hidden');
            elements.moreMenu.classList.add('hidden');
        };

        elements.sortPopupBtn.onclick = (e) => {
            e.stopPropagation();
            hideModals(); // Close others
            elements.sortMenu.classList.toggle('hidden');
        };

        elements.searchPopupBtn.onclick = (e) => {
            e.stopPropagation();
            showModal(elements.searchModal);
        };

        elements.addWordBtn.onclick = (e) => {
            e.stopPropagation();
            openWordModal();
        };

        elements.moreMenuBtn.onclick = (e) => {
            e.stopPropagation();
            hideModals(); // Close others
            elements.moreMenu.classList.toggle('hidden');
        };

        document.getElementById('word-confirm').onclick = handleWordSave;
        document.getElementById('word-cancel').onclick = hideModals;
        elements.wordInput.oninput = (e) => {
            document.getElementById('word-char-count').textContent = e.target.value.length;
        };

        document.querySelectorAll('.color-circle').forEach(c => {
            c.onclick = () => {
                document.querySelectorAll('.color-circle').forEach(x => x.classList.remove('selected'));
                c.classList.add('selected');
            };
        });

        // Folder selection inside word modal
        document.getElementById('word-folder-select').onclick = (e) => {
            e.stopPropagation();
            const btn = e.target;

            const btnRect = btn.getBoundingClientRect();
            const containerRect = document.querySelector('.mobile-container').getBoundingClientRect();

            elements.folderDropdown.style.top = `${btnRect.bottom - containerRect.top}px`;
            elements.folderDropdown.style.left = `${btnRect.left - containerRect.left}px`;
            elements.folderDropdown.style.width = `${btnRect.offsetWidth}px`;

            elements.folderDropdown.classList.toggle('hidden');

            // Temporary override folder click to update modal instead of main view
            const originalFolders = Array.from(elements.folderListItems.children);
            originalFolders.forEach(folderBtn => {
                const originalOnClick = folderBtn.onclick;
                folderBtn.onclick = (ev) => {
                    ev.stopPropagation();
                    const folderName = folderBtn.textContent;
                    const folderId = storage.getFolders().find(f => f.name === folderName).id;
                    btn.textContent = `${folderName} ∨`;
                    btn.dataset.id = folderId;
                    elements.folderDropdown.classList.add('hidden');
                    // Restore original logic
                    originalFolders.forEach((b, i) => b.onclick = originalFolders[i]._origClick);
                };
                folderBtn._origClick = originalOnClick;
            });
        };

        document.getElementById('add-folder-trigger').onclick = () => {
            elements.folderDropdown.classList.add('hidden');
            elements.folderInput.value = '';
            document.getElementById('folder-char-count').textContent = '0';
            showModal(elements.folderModal);
        };
        document.getElementById('folder-confirm').onclick = () => {
            const name = elements.folderInput.value.trim();
            if (name) {
                storage.addFolder(name);
                renderFolders();
                hideModals();
            }
        };
        document.getElementById('folder-cancel').onclick = hideModals;
        elements.folderInput.oninput = (e) => {
            document.getElementById('folder-char-count').textContent = e.target.value.length;
        };

        document.getElementById('cancel-selection-btn').onclick = exitSelectionMode;
        document.getElementById('delete-selected-btn').onclick = () => showModal(elements.deleteModal);
        document.getElementById('delete-confirm').onclick = () => {
            storage.deleteWords(Array.from(selectedWordIds));
            exitSelectionMode();
            hideModals();
        };
        document.getElementById('delete-cancel').onclick = hideModals;

        document.querySelectorAll('#sort-menu .menu-item').forEach(btn => {
            btn.onclick = () => {
                currentSort = btn.dataset.sort;
                renderWords();
                hideModals();
            };
        });

        document.getElementById('search-confirm').onclick = handleSearch;
        document.getElementById('search-prev').onclick = () => navigateSearch(-1);
        document.getElementById('search-next').onclick = () => navigateSearch(1);
        document.getElementById('search-cancel').onclick = () => {
            document.querySelectorAll('.word-chip').forEach(c => c.classList.remove('highlight'));
            hideModals();
        };

        document.getElementById('export-btn').onclick = handleExport;
        document.getElementById('import-btn').onclick = () => elements.importInput.click();
        elements.importInput.onchange = handleImport;
    }

    function handleWordSave() {
        const text = elements.wordInput.value.trim();
        if (!text) return;

        const selectedColorCircle = document.querySelector('.color-circle.selected');
        const color = selectedColorCircle ? selectedColorCircle.dataset.color : '#e2e8f0';
        const folderId = document.getElementById('word-folder-select').dataset.id || 'all';

        if (editingWordId) {
            storage.updateWord(editingWordId, { text, color, folderId });
        } else {
            storage.addWord({ text, color, folderId });
        }

        renderWords();
        hideModals();
    }

    function handleSearch() {
        const query = elements.searchInput.value.trim().toLowerCase();
        if (!query) return;

        const chips = Array.from(document.querySelectorAll('.word-chip'));
        searchResults = chips.filter(c => c.textContent.toLowerCase().includes(query));

        if (searchResults.length > 0) {
            currentSearchIndex = 0;
            updateSearchNav();
            highlightSearchResult();
        } else {
            document.getElementById('search-index').textContent = '0/0';
        }
    }

    function navigateSearch(dir) {
        if (searchResults.length === 0) return;
        currentSearchIndex = (currentSearchIndex + dir + searchResults.length) % searchResults.length;
        updateSearchNav();
        highlightSearchResult();
    }

    function updateSearchNav() {
        document.getElementById('search-index').textContent = `${currentSearchIndex + 1}/${searchResults.length}`;
    }

    function highlightSearchResult() {
        document.querySelectorAll('.word-chip').forEach(c => c.classList.remove('highlight'));
        const activeChip = searchResults[currentSearchIndex];
        activeChip.classList.add('highlight');
        activeChip.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function handleExport() {
        const words = storage.getWords();
        const folders = storage.getFolders();
        let csvContent = "data:text/csv;charset=utf-8,Type,ID,Text/Name,Folder/Color,Created\r\n";
        folders.forEach(f => csvContent += `Folder,${f.id},"${f.name}",,${f.createdAt}\r\n`);
        words.forEach(w => csvContent += `Word,${w.id},"${w.text}",${w.folderId},${w.createdAt}\r\n`);

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `word_memo_backup_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function handleImport(e) {
        alert("가져오기 기능은 데이터 형식 검증 후 적용됩니다. (JSON 권장)");
    }

    init();
});
