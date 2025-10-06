import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getRandomWords, saveGameSession } from '@/lib/db';
import { Word, GameSession } from '@/types/api';
import { useAuth } from '@/components/AuthProvider';
import { BookOpen, Brain, Shuffle, Lightbulb, Clock } from 'lucide-react-native';

type GameType = 'match' | 'mcq' | 'jumbled' | 'hints';

interface GameState {
  currentWord: Word | null;
  options: string[];
  score: number;
  questionsAnswered: number;
  correctAnswers: number;
  timeLeft: number;
  isActive: boolean;
  gameType: GameType | null;
  words: Word[];
  currentIndex: number;
}

export default function GamesScreen() {
  const { user } = useAuth();
  const [gameState, setGameState] = useState<GameState>({
    currentWord: null,
    options: [],
    score: 0,
    questionsAnswered: 0,
    correctAnswers: 0,
    timeLeft: 0,
    isActive: false,
    gameType: null,
    words: [],
    currentIndex: 0,
  });

  const [timer, setTimer] = useState<ReturnType<typeof setInterval> | null>(null);

  const gameTypes = [
    {
      type: 'match' as GameType,
      title: 'Match Game',
      description: 'Match Tamil words with their meanings',
      icon: BookOpen,
      color: '#FF6B35',
      difficulty: 'Easy',
    },
    {
      type: 'mcq' as GameType,
      title: 'MCQ Challenge',
      description: 'Multiple choice questions',
      icon: Brain,
      color: '#4ECDC4',
      difficulty: 'Medium',
    },
    {
      type: 'jumbled' as GameType,
      title: 'Jumbled Words',
      description: 'Unscramble Tamil words',
      icon: Shuffle,
      color: '#45B7D1',
      difficulty: 'Hard',
    },
    {
      type: 'hints' as GameType,
      title: 'Hint Master',
      description: 'Guess words from hints',
      icon: Lightbulb,
      color: '#FFA726',
      difficulty: 'Medium',
    },
  ];

  useEffect(() => {
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [timer]);

  const startGame = async (type: GameType) => {
    try {
      const words = await getRandomWords(10);
      if (words.length === 0) {
        Alert.alert('Error', 'No words available. Please try again later.');
        return;
      }

      setGameState({
        currentWord: words[0],
        options: generateOptions(words[0], words, type),
        score: 0,
        questionsAnswered: 0,
        correctAnswers: 0,
        timeLeft: 180, // 3 minutes
        isActive: true,
        gameType: type,
        words,
        currentIndex: 0,
      });

      // Start timer
      const newTimer = setInterval(() => {
        setGameState(prev => {
          if (prev.timeLeft <= 1) {
            endGame(prev);
            return prev;
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 };
        });
      }, 1000);

      setTimer(newTimer);
    } catch (error) {
      console.error('Error starting game:', error);
      Alert.alert('Error', 'Failed to start game. Please try again.');
    }
  };

  const generateOptions = (word: Word, allWords: Word[], type: GameType): string[] => {
    const correctAnswer = word.meaning_ta || word.word;
    const otherWords = allWords.filter(w => w.id !== word.id);
    const wrongOptions = otherWords
      .slice(0, 3)
      .map(w => type === 'jumbled' ? shuffleString(w.word) : w.meaning_ta || w.word);

    const options = [correctAnswer, ...wrongOptions];
    return options.sort(() => 0.5 - Math.random());
  };

  const shuffleString = (str: string): string => {
    return str.split('').sort(() => 0.5 - Math.random()).join('');
  };

  const handleAnswer = (selectedOption: string) => {
    if (!gameState.currentWord || !gameState.isActive) return;

    const isCorrect = selectedOption === (gameState.currentWord.meaning_ta || gameState.currentWord.word);
    const points = isCorrect ? 10 : 0;

    const newQuestionsAnswered = gameState.questionsAnswered + 1;
    const newCorrectAnswers = gameState.correctAnswers + (isCorrect ? 1 : 0);
    const newScore = gameState.score + points;

    // Check if game should continue
    if (newQuestionsAnswered >= gameState.words.length || gameState.currentIndex >= gameState.words.length - 1) {
      endGame({
        ...gameState,
        score: newScore,
        questionsAnswered: newQuestionsAnswered,
        correctAnswers: newCorrectAnswers,
      });
      return;
    }

    // Move to next question
    const nextIndex = gameState.currentIndex + 1;
    const nextWord = gameState.words[nextIndex];

    setGameState(prev => ({
      ...prev,
      currentWord: nextWord,
      options: generateOptions(nextWord, prev.words, prev.gameType!),
      score: newScore,
      questionsAnswered: newQuestionsAnswered,
      correctAnswers: newCorrectAnswers,
      currentIndex: nextIndex,
    }));

    // Show feedback
    Alert.alert(
      isCorrect ? 'Correct! 🎉' : 'Incorrect 😔',
      isCorrect ? `You earned ${points} points!` : `The correct answer was: ${gameState.currentWord.meaning_ta}`,
      [{ text: 'Continue', style: 'default' }],
      { cancelable: false }
    );
  };

  const endGame = async (finalState: GameState) => {
    if (timer) {
      clearInterval(timer);
      setTimer(null);
    }

    setGameState(prev => ({ ...prev, isActive: false }));

    try {
      if (user && finalState.gameType) {
        await saveGameSession({
          user_id: user.id,
          game_type: finalState.gameType,
          score: finalState.score,
          max_score: finalState.words.length * 10,
          questions_answered: finalState.questionsAnswered,
          correct_answers: finalState.correctAnswers,
          duration_seconds: 180 - finalState.timeLeft,
          difficulty_level: 'medium',
        });
      }
    } catch (error) {
      console.error('Error saving game session:', error);
    }

    Alert.alert(
      'Game Complete!',
      `Final Score: ${finalState.score}\nCorrect Answers: ${finalState.correctAnswers}/${finalState.questionsAnswered}\nAccuracy: ${Math.round((finalState.correctAnswers / finalState.questionsAnswered) * 100) || 0}%`,
      [
        { text: 'Play Again', onPress: () => resetGame() },
        { text: 'Back to Games', style: 'cancel' }
      ]
    );
  };

  const resetGame = () => {
    if (timer) {
      clearInterval(timer);
      setTimer(null);
    }
    setGameState({
      currentWord: null,
      options: [],
      score: 0,
      questionsAnswered: 0,
      correctAnswers: 0,
      timeLeft: 0,
      isActive: false,
      gameType: null,
      words: [],
      currentIndex: 0,
    });
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (gameState.isActive && gameState.currentWord) {
    return (
      <View style={styles.gameContainer}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.gameHeader}
        >
          <View style={styles.gameInfo}>
            <Text style={styles.gameTitle}>
              {gameTypes.find(g => g.type === gameState.gameType)?.title}
            </Text>
            <View style={styles.gameStats}>
              <View style={styles.statItem}>
                <Clock size={16} color="#FFF" />
                <Text style={styles.statText}>{formatTime(gameState.timeLeft)}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statText}>Score: {gameState.score}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statText}>
                  {gameState.questionsAnswered + 1}/{gameState.words.length}
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>
            {gameState.gameType === 'jumbled' ? 'Unscramble this word:' : 
             gameState.gameType === 'hints' ? 'Guess the word from hint:' :
             'What does this word mean?'}
          </Text>
          
          <Text style={styles.wordText}>
            {gameState.gameType === 'jumbled' ? 
              shuffleString(gameState.currentWord.word) : 
              gameState.currentWord.word}
          </Text>

          {gameState.gameType === 'hints' && gameState.currentWord.notes && (
            <Text style={styles.hintText}>
              Hint: {gameState.currentWord.notes}
            </Text>
          )}

          <View style={styles.optionsContainer}>
            {gameState.options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={styles.optionButton}
                onPress={() => handleAnswer(option)}
              >
                <Text style={styles.optionText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity 
          style={styles.quitButton}
          onPress={() => {
            Alert.alert(
              'Quit Game?',
              'Are you sure you want to quit? Your progress will be saved.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Quit', style: 'destructive', onPress: () => endGame(gameState) }
              ]
            );
          }}
        >
          <Text style={styles.quitButtonText}>Quit Game</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={['#FF6B35', '#F7931E']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Tamil Word Games</Text>
        <Text style={styles.headerSubtitle}>Choose a game to start learning!</Text>
      </LinearGradient>

      <View style={styles.gamesContainer}>
        {gameTypes.map((game, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.gameCard, { borderLeftColor: game.color }]}
            onPress={() => startGame(game.type)}
          >
            <LinearGradient
              colors={[game.color + '20', game.color + '10']}
              style={styles.gameCardGradient}
            >
              <View style={styles.gameCardContent}>
                <View style={styles.gameIcon}>
                  <game.icon size={28} color={game.color} />
                </View>
                <View style={styles.gameDetails}>
                  <Text style={styles.gameCardTitle}>{game.title}</Text>
                  <Text style={styles.gameDescription}>{game.description}</Text>
                  <Text style={[styles.difficulty, { color: game.color }]}>
                    {game.difficulty}
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsTitle}>How to Play</Text>
        <View style={styles.instructionsList}>
          <Text style={styles.instruction}>• Match Game: Connect words with meanings</Text>
          <Text style={styles.instruction}>• MCQ: Choose the correct meaning from options</Text>
          <Text style={styles.instruction}>• Jumbled: Unscramble the letters to form words</Text>
          <Text style={styles.instruction}>• Hints: Use clues to guess the correct word</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#FFF',
    opacity: 0.9,
    textAlign: 'center',
  },
  gamesContainer: {
    padding: 20,
    gap: 15,
  },
  gameCard: {
    borderRadius: 15,
    borderLeftWidth: 5,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gameCardGradient: {
    padding: 20,
  },
  gameCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gameIcon: {
    marginRight: 15,
  },
  gameDetails: {
    flex: 1,
  },
  gameCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  gameDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  difficulty: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  instructionsContainer: {
    padding: 20,
    paddingTop: 0,
  },
  instructionsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  instructionsList: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instruction: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  // Game screen styles
  gameContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  gameHeader: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  gameInfo: {
    alignItems: 'center',
  },
  gameTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 15,
  },
  gameStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
  questionContainer: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  questionText: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  wordText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF6B35',
    textAlign: 'center',
    marginBottom: 20,
    minHeight: 50,
  },
  hintText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    fontStyle: 'italic',
  },
  optionsContainer: {
    width: '100%',
    gap: 15,
  },
  optionButton: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  optionText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    fontWeight: '500',
  },
  quitButton: {
    margin: 20,
    backgroundColor: '#FF6B6B',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  quitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});