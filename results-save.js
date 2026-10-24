// ============================================================
// results-save.js - Auto Save Wrong Questions (Smart Fix)
// Har chapter file mein <script src="results-save.js"></script> add karein
// (Quiz logic wale script tag ke theek baad)
// ============================================================

window.addEventListener('load', function() {
  setTimeout(function() {
    
    // Check karo ki user login hai ya nahi
    const userData = localStorage.getItem('cbt_user');
    if (!userData) return;
    const currentUser = JSON.parse(userData);

    // Agar showResult function exist karta hai
    if (typeof window.showResult === 'function' && !window.isOverridden) {
      window.isOverridden = true; // Double save rokne ke liye flag
      
      const _originalShowResult = window.showResult;
      
      window.showResult = function() {
        _originalShowResult(); // Pehle purana function chalao (Modal dikhane ke liye)
        
        // --- Naya Save Logic ---
        // Check karo ki variables global hain ya nahi (taki error na aaye)
        if (typeof questions === 'undefined' || typeof userAnswers === 'undefined' || typeof correctCount === 'undefined') {
          console.warn("⚠️ results-save.js: Global variables not found. Make sure this script is added correctly.");
          return;
        }

        const totalQ = questions.length;
        const marks = correctCount * 1 - wrongCount * 0.25;
        const percent = parseFloat(((marks / totalQ) * 100).toFixed(2));
        
        // 1. Galat sawaalon ki list banao
        const wrongQuestions = [];
        for (let i = 0; i < totalQ; i++) {
          if (userAnswers[i] !== null && userAnswers[i] !== questions[i].ans) {
            wrongQuestions.push({
              qIndex: i,
              q: questions[i].q,
              yourAns: userAnswers[i],
              yourAnsText: questions[i].opts[userAnswers[i]],
              correctAns: questions[i].ans,
              correctAnsText: questions[i].opts[questions[i].ans],
              exp: questions[i].exp || ''
            });
          }
        }

        // 2. Attempt Data banao
        // Dhyan de: Yahan CHAPTER_NUM global variable use ho raha hai jo har file me hota hai
        const attemptData = {
          userName: currentUser.name,
          userRole: currentUser.role,
          chapterNum: typeof CHAPTER_NUM !== 'undefined' ? CHAPTER_NUM : 0,
          correct: correctCount,
          wrong: wrongCount,
          total: totalQ,
          marks: parseFloat(marks.toFixed(2)),
          percent: percent,
          wrongQuestions: wrongQuestions, // ⭐ Naya Feature
          timestamp: new Date().toISOString()
        };
        
        // 3. LocalStorage me save karo
        const results = JSON.parse(localStorage.getItem('cbt_results') || '{}');
        const key = currentUser.name + '_chapter' + attemptData.chapterNum;
        if (!results[key]) results[key] = { attempts: [], totalAttempts: 0 };
        results[key].attempts.push(attemptData);
        if (results[key].attempts.length > 10) results[key].attempts = results[key].attempts.slice(-10);
        const bestPercent = Math.max(...results[key].attempts.map(a => a.percent));
        results[key].best = results[key].attempts.find(a => a.percent === bestPercent);
        localStorage.setItem('cbt_results', JSON.stringify(results));
        console.log('✅ Saved to localStorage (via results-save.js)');
        
        // 4. Firebase me save karo
        // Purane saveToFirebase function ko replace nahi kar rahe, balki naya bana rahe hain
        if (typeof firebaseConfig !== 'undefined') {
            import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js").then(({ initializeApp }) => {
                import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js").then(({ getFirestore, collection, addDoc }) => {
                    try {
                        const app = initializeApp(firebaseConfig, 'autoChapter' + attemptData.chapterNum + Date.now());
                        const db = getFirestore(app);
                        addDoc(collection(db, "results"), attemptData).then(() => {
                            console.log('✅ Saved to Firebase (via results-save.js)');
                        });
                    } catch (e) {
                        console.error('❌ Firebase save error:', e);
                    }
                });
            });
        }
      };
    }
  }, 800); // 800ms delay taaki page aur dusre scripts load ho jayein
});
