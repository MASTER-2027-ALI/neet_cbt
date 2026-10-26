// ============================================================
// autosave.js - Auto Save on Refresh + Auto Load (Global)
// ============================================================

window.isTestSubmitted = false;

// Page load hone ka wait karo
window.addEventListener('load', function() {
    setTimeout(function() {
        // Check karo ki ye CBT page hai ya nahi
        if (typeof questions === 'undefined' || typeof totalQ === 'undefined') return;
        if (typeof CHAPTER_NUM === 'undefined') return;

        // 1. PURANA DATA LOAD KARO (Agar refresh hua hai)
        async function loadAutoSaveData() {
            try {
                const userData = localStorage.getItem('cbt_user');
                if (!userData) return;
                const currentUser = JSON.parse(userData);

                if (typeof firebaseConfig !== 'undefined') {
                    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js");
                    const { getFirestore, collection, query, where, getDocs } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
                    
                    const app = initializeApp(firebaseConfig, 'autosaveLoad' + CHAPTER_NUM);
                    const db = getFirestore(app);
                    
                    const q = query(
                        collection(db, "autosave"), 
                        where("userName", "==", currentUser.name),
                        where("chapterNum", "==", CHAPTER_NUM)
                    );
                    
                    const snapshot = await getDocs(q);
                    
                    if (!snapshot.empty) {
                        let latestData = null;
                        let latestTime = 0;
                        
                        snapshot.forEach(doc => {
                            const data = doc.data();
                            const time = new Date(data.timestamp).getTime();
                            if (time > latestTime) {
                                latestTime = time;
                                latestData = data;
                            }
                        });

                        if (latestData) {
                            // Variables ko update karo (Global scope me)
                            for(let i=0; i<totalQ; i++) {
                                userAnswers[i] = latestData.userAnswers[i];
                                marked[i] = latestData.marked[i];
                                visited[i] = latestData.visited[i];
                            }
                            
                            // 🔥 Note: currentQ ko change karne ke liye 
                            // hum window object ka use karenge kyunki 'let' se variable change nahi hota
                            if (typeof renderQuestion === 'function') {
                                // Agar currentQ let hai, to usko direct nahi badal sakte.
                                // Isliye hum pura UI refresh karenge jo currentQ 0 kar dega (safe side).
                                // Par agar hum direct global currentQ access kar sakte hain to behtar hai.
                            }
                            
                            // Correct aur Wrong count dobara calculate karo
                            correctCount = 0;
                            wrongCount = 0;
                            for (let i = 0; i < totalQ; i++) {
                                if (userAnswers[i] !== null) {
                                    if (userAnswers[i] === questions[i].ans) correctCount++;
                                    else wrongCount++;
                                }
                            }
                            
                            // UI Update karo
                            if (typeof renderQuestion === 'function') {
                                renderQuestion(); // Ye current question render karega
                            }
                            console.log('✅ Purana data restore ho gaya!');
                        }
                    }
                }
            } catch(e) {
                console.error('Auto-save load error:', e);
            }
        }

        // 2. AUTO SAVE FUNCTION
        window.saveAutoSave = async function() {
            try {
                const userData = localStorage.getItem('cbt_user');
                if (!userData || window.isTestSubmitted) return;
                const currentUser = JSON.parse(userData);

                const autoSaveData = {
                    userName: currentUser.name,
                    chapterNum: CHAPTER_NUM,
                    userAnswers: userAnswers,
                    marked: marked,
                    visited: visited,
                    currentQ: typeof currentQ !== 'undefined' ? currentQ : 0,
                    timestamp: new Date().toISOString()
                };

                if (typeof firebaseConfig !== 'undefined') {
                    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js");
                    const { getFirestore, collection, addDoc } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
                    
                    const app = initializeApp(firebaseConfig, 'autosave' + CHAPTER_NUM + Date.now());
                    const db = getFirestore(app);
                    await addDoc(collection(db, "autosave"), autoSaveData);
                }
            } catch(e) {
                console.error('Auto-save error:', e);
            }
        }

        // 3. AUTO-SAVE KO HAR ACTION PAR TRIGGER KARO
        // Hum in functions ko override karenge taaki har file me change na karna pade
        
        // Purane functions ko save karo
        const _originalSelectAnswer = window.selectAnswer || selectAnswer;
        const _originalNextQuestion = window.nextQuestion || nextQuestion;
        const _originalPrevQuestion = window.prevQuestion || prevQuestion;
        const _originalToggleMark = window.toggleMark || toggleMark;

        // Naye functions banao jo save bhi karein
        window.selectAnswer = function(optIdx) {
            _originalSelectAnswer(optIdx);
            window.saveAutoSave();
        };
        window.nextQuestion = function() {
            _originalNextQuestion();
            window.saveAutoSave();
        };
        window.prevQuestion = function() {
            _originalPrevQuestion();
            window.saveAutoSave();
        };
        window.toggleMark = function() {
            _originalToggleMark();
            window.saveAutoSave();
        };

        // Agar page par inline onclick hai (jaise onclick="selectAnswer(0)"), 
        // to ye override kaam nahi karega kyunki inline direct global function dhundhta hai.
        // Isliye hum global scope me bhi assign karenge:
        if (typeof selectAnswer === 'function') selectAnswer = window.selectAnswer;
        if (typeof nextQuestion === 'function') nextQuestion = window.nextQuestion;
        if (typeof prevQuestion === 'function') prevQuestion = window.prevQuestion;
        if (typeof toggleMark === 'function') toggleMark = window.toggleMark;

        // 4. SUBMIT HONE PAR AUTOSAVE CLEAR KARO
        // showResult function ko override karo
        if (typeof showResult === 'function') {
            const _originalShowResult = window.showResult || showResult;
            window.showResult = function() {
                window.isTestSubmitted = true; // Auto-save band karo
                _originalShowResult();
            };
            showResult = window.showResult;
        }

        // 5. START LOAD KARO
        loadAutoSaveData();

    }, 1000); // 1 second wait taaki page ke saare functions load ho jayein
});
