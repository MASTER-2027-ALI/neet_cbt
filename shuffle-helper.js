// ============================================================
// shuffle-helper.js — Question Shuffle for NEET CBT
// Har chapter file mein include karo:
//   <script src="shuffle-helper.js"></script>
//   (questions array ke BAAD, quiz logic ke PEHLE)
// ============================================================

(function() {
    // Agar questions array nahi mila to chup-chaap return
    if (typeof questions === 'undefined' || !Array.isArray(questions)) {
        console.warn('shuffle-helper: questions array not found. Include this script AFTER the questions array.');
        return;
    }

    // Original order ko safe copy karo (deep copy — nested opts bhi)
    const _originalQuestions = JSON.parse(JSON.stringify(questions));

    // Fisher-Yates shuffle
    window.shuffleQuestions = function() {
        const shuffled = JSON.parse(JSON.stringify(_originalQuestions));
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    };

    // Har page load par shuffle karo (in-place)
    window.applyShuffle = function() {
        const shuffled = window.shuffleQuestions();
        for (let i = 0; i < questions.length; i++) questions[i] = shuffled[i];
    };

    window.applyShuffle();
    console.log('✅ shuffle-helper: Questions shuffled (' + questions.length + ' questions)');
})();
