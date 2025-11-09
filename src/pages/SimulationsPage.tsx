import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Simulation } from '../types/database';
import { useAuth } from '../contexts/AuthContext';
import './SimulationsPage.css';

export default function SimulationsPage() {
  const { user } = useAuth();
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSimulation, setActiveSimulation] = useState<Simulation | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    loadSimulations();
  }, []);

  const loadSimulations = async () => {
    try {
      const { data, error } = await supabase
        .from('simulations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSimulations(data || []);
    } catch (error) {
      console.error('Error loading simulations:', error);
    } finally {
      setLoading(false);
    }
  };

  const startSimulation = (simulation: Simulation) => {
    setActiveSimulation(simulation);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setShowResults(false);
    setScore(0);
  };

  const selectAnswer = (answerIndex: number) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: answerIndex
    }));
  };

  const nextQuestion = () => {
    if (activeSimulation && currentQuestionIndex < activeSimulation.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const submitSimulation = async () => {
    if (!activeSimulation || !user) return;

    let correctAnswers = 0;
    activeSimulation.questions.forEach((question, index) => {
      if (answers[index] === question.correct_answer) {
        correctAnswers++;
      }
    });

    const calculatedScore = Math.round((correctAnswers / activeSimulation.questions.length) * 100);
    setScore(calculatedScore);
    setShowResults(true);

    try {
      await supabase.from('simulation_results').insert({
        simulation_id: activeSimulation.id,
        user_id: user.id,
        score: calculatedScore,
        answers: answers
      });
    } catch (error) {
      console.error('Error saving results:', error);
    }
  };

  const closeSimulation = () => {
    setActiveSimulation(null);
    setShowResults(false);
  };

  if (loading) {
    return <div className="loading">טוען סימולציות...</div>;
  }

  if (activeSimulation) {
    const currentQuestion = activeSimulation.questions[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === activeSimulation.questions.length - 1;
    const allQuestionsAnswered = Object.keys(answers).length === activeSimulation.questions.length;

    if (showResults) {
      const passed = score >= activeSimulation.passing_score;

      return (
        <div className="simulation-container">
          <div className="results-screen">
            <h2>תוצאות הסימולציה</h2>
            <div className={`score-display ${passed ? 'passed' : 'failed'}`}>
              <div className="score-number">{score}%</div>
              <div className="score-text">
                {passed ? '✓ עברת בהצלחה!' : '✗ לא עברת'}
              </div>
            </div>
            <p className="passing-score">ציון עובר: {activeSimulation.passing_score}%</p>
            <div className="results-actions">
              <button className="btn btn-primary" onClick={() => startSimulation(activeSimulation)}>
                נסה שוב
              </button>
              <button className="btn btn-secondary" onClick={closeSimulation}>
                חזרה לרשימה
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="simulation-container">
        <div className="simulation-header">
          <h2>{activeSimulation.title}</h2>
          <button className="btn btn-secondary" onClick={closeSimulation}>
            יציאה
          </button>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${((currentQuestionIndex + 1) / activeSimulation.questions.length) * 100}%` }}
          />
        </div>
        <div className="question-counter">
          שאלה {currentQuestionIndex + 1} מתוך {activeSimulation.questions.length}
        </div>
        <div className="question-card">
          <h3>{currentQuestion.question}</h3>
          <div className="answers-list">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                className={`answer-option ${answers[currentQuestionIndex] === index ? 'selected' : ''}`}
                onClick={() => selectAnswer(index)}
              >
                <span className="option-number">{index + 1}</span>
                <span className="option-text">{option}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="navigation-buttons">
          <button
            className="btn btn-secondary"
            onClick={previousQuestion}
            disabled={currentQuestionIndex === 0}
          >
            שאלה קודמת
          </button>
          {!isLastQuestion ? (
            <button
              className="btn btn-primary"
              onClick={nextQuestion}
            >
              שאלה הבאה
            </button>
          ) : (
            <button
              className="btn btn-primary"
              onClick={submitSimulation}
              disabled={!allQuestionsAnswered}
            >
              סיים סימולציה
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="simulations-page">
      <div className="page-header">
        <h1>סימולציות והדרכה</h1>
        <p>מבחני הסמכה והדרכה לנציגי שירות</p>
      </div>

      <div className="simulations-grid">
        {simulations.map(simulation => (
          <div key={simulation.id} className="simulation-card card">
            <div className="simulation-icon">🎯</div>
            <h3>{simulation.title}</h3>
            <p className="simulation-description">{simulation.description}</p>
            <div className="simulation-info">
              <div className="info-item">
                <strong>{simulation.questions.length}</strong> שאלות
              </div>
              <div className="info-item">
                <strong>{simulation.passing_score}%</strong> ציון עובר
              </div>
            </div>
            <button
              className="btn btn-primary simulation-start-btn"
              onClick={() => startSimulation(simulation)}
            >
              התחל סימולציה
            </button>
          </div>
        ))}
      </div>

      {simulations.length === 0 && (
        <div className="no-results">
          <p>אין סימולציות זמינות כרגע</p>
        </div>
      )}
    </div>
  );
}
