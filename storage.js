/**
 * Storage utility for Word Memo App (Mobile V2)
 */
const WORDS_KEY = 'word_memo_words_v2';
const FOLDERS_KEY = 'word_memo_folders_v2';
const THEME_KEY = 'word_memo_theme';

const storage = {
    /**
     * Folders Management
     */
    getFolders() {
        const data = localStorage.getItem(FOLDERS_KEY);
        try {
            let folders = data ? JSON.parse(data) : [];
            // Ensure 'ALL' folder exists
            if (folders.length === 0) {
                folders = [{ id: 'all', name: 'ALL', createdAt: new Date().toISOString() }];
                this.saveFolders(folders);
            }
            return folders;
        } catch (e) {
            console.error('Failed to parse folders', e);
            return [{ id: 'all', name: 'ALL', createdAt: new Date().toISOString() }];
        }
    },

    saveFolders(folders) {
        localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
    },

    addFolder(name) {
        const folders = this.getFolders();
        const newFolder = {
            id: Date.now().toString(),
            name: name.substring(0, 10).trim(), // 10자 제한
            createdAt: new Date().toISOString()
        };
        folders.push(newFolder);
        this.saveFolders(folders);
        return newFolder;
    },

    /**
     * Words Management
     */
    getWords() {
        const data = localStorage.getItem(WORDS_KEY);
        try {
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Failed to parse words', e);
            return [];
        }
    },

    saveWords(words) {
        localStorage.setItem(WORDS_KEY, JSON.stringify(words));
    },

    addWord(wordData) {
        const words = this.getWords();
        const newWord = {
            id: Date.now().toString(),
            text: wordData.text.substring(0, 20).trim(), // 20자 제한
            folderId: wordData.folderId || 'all',
            color: wordData.color || '#e2e8f0', // 기본 회색
            createdAt: new Date().toISOString()
        };
        words.unshift(newWord);
        this.saveWords(words);
        return newWord;
    },

    updateWord(id, updates) {
        const words = this.getWords();
        const index = words.findIndex(w => w.id === id);
        if (index !== -1) {
            words[index] = { ...words[index], ...updates };
            if (updates.text) words[index].text = updates.text.substring(0, 20).trim();
            this.saveWords(words);
            return words[index];
        }
        return null;
    },

    deleteWords(ids) {
        const words = this.getWords();
        const filtered = words.filter(w => !ids.includes(w.id));
        this.saveWords(filtered);
    },

    moveWordsToFolder(ids, folderId) {
        const words = this.getWords();
        words.forEach(w => {
            if (ids.includes(w.id)) {
                w.folderId = folderId;
            }
        });
        this.saveWords(words);
    },

    /**
     * Data Import (Merge)
     */
    importData(data) {
        const currentFolders = this.getFolders();
        const currentWords = this.getWords();
        let folderCount = 0;
        let wordCount = 0;

        const importedFolders = data.filter(item => item.type === 'Folder');
        const importedWords = data.filter(item => item.type === 'Word');

        // Merge Folders
        importedFolders.forEach(f => {
            if (!currentFolders.some(cf => cf.id === f.id)) {
                currentFolders.push({
                    id: f.id,
                    name: f.name,
                    createdAt: f.createdAt || new Date().toISOString()
                });
                folderCount++;
            }
        });

        // Merge Words
        importedWords.forEach(w => {
            if (!currentWords.some(cw => cw.id === w.id)) {
                currentWords.push({
                    id: w.id,
                    text: w.text,
                    folderId: w.folderId,
                    color: w.color || '#e2e8f0',
                    createdAt: w.createdAt || new Date().toISOString()
                });
                wordCount++;
            }
        });

        if (folderCount > 0) this.saveFolders(currentFolders);
        if (wordCount > 0) this.saveWords(currentWords);

        return { folderCount, wordCount };
    },

    /**
     * Theme management
     */
    getTheme() {
        return localStorage.getItem(THEME_KEY) || 'light';
    },

    setTheme(theme) {
        localStorage.setItem(THEME_KEY, theme);
    }
};
