// ============================================================
// shuffle.js - Question & Option Shuffle on SUBMIT only
// ============================================================

(function() {
    // Original questions ko safe rakhne ke liye deep copy
    let originalQuestions = [];
    let isInitialized = false;

    // Har page load par original questions save karo
    window.addEventListener('load', function() {
        setTimeout(function() {
            if (typeof questions !== 'undefined' && !isInitialized) {
                originalQuestions = JSON.parse(JSON.stringify(questions));
                isInitialized = true;
                console.log('✅ shuffle.js: Original questions saved.');
            }
        }, 500);
    });

    // Shuffle karne ka main function
    window.shuffleQuestionsAndOptions = function() {
        if (originalQuestions.length === 0) return;

        // 1. Questions ko shuffle karo
        let shuffledQs = JSON.parse(JSON.stringify(originalQuestions));
        for (let i = shuffledQs.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledQs[i], shuffledQs[j]] = [shuffledQs[j], shuffledQs[i]];
        }

        // 2. Har question ke options ko shuffle karo
        shuffledQs.forEach(q => {
            let correctText = q.opts[q.ans]; // Sahi answer ka text nikaalo
            
            // Options ko shuffle karo
            for (let i = q.opts.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [q.opts[i], q.opts[j]] = [q.opts[j], q.opts[i]];
            }
            
            // Naya 'ans' index dhundho
            q.ans = q.opts.indexOf(correctText);
        });

        // 3. Global 'questions' array ko update karo
        for (let i = 0; i < questions.length; i++) {
            questions[i] = shuffledQs[i];
        }
        console.log('🔀 Questions and Options shuffled after submit!');
    };

    // Sirf Submit function ko override karo
    window.addEventListener('load', function() {
        setTimeout(function() {
            if (!isInitialized) return;

            if (typeof window.showResult === 'function' || typeof showResult === 'function') {
                const _originalShowResult = window.showResult || showResult;
                
                window.showResult = function() {
                    _originalShowResult(); // Pehle result modal dikhao
                    
                    // Result dikhne ke baad chupchap shuffle kardo taaki agla test naye order me ho
                    setTimeout(() => {
                        window.shuffleQuestionsAndOptions();
                    }, 1000); // 1 second baad shuffle karega taaki user result dekh le
                };
                
                if (typeof showResult === 'function') showResult = window.showResult;
            }

            console.log('✅ shuffle.js: Submit hooked successfully.');
        }, 1000);
    });
})();
