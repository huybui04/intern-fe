import { Assignment, Question, Answer, Submission } from "../types/assignment";

export interface AutoGradeResult {
  score: number;
  maxScore: number;
  feedback: string;
  questionResults: QuestionResult[];
  canAutoGrade: boolean;
}

export interface QuestionResult {
  questionId: string;
  questionText: string;
  questionType: string;
  studentAnswer: string | string[] | boolean | number;
  correctAnswer?: string | string[] | boolean | number;
  isCorrect: boolean;
  pointsEarned: number;
  maxPoints: number;
  isAutoGradeable: boolean;
}

/**
 * Auto-grade a submission based on assignment questions and student answers
 */
export const autoGradeSubmission = (
  assignment: Assignment,
  answers: Answer[]
): AutoGradeResult => {
  if (!assignment.questions || assignment.questions.length === 0) {
    return {
      score: 0,
      maxScore: assignment.totalPoints,
      feedback: "No questions found in assignment",
      questionResults: [],
      canAutoGrade: false,
    };
  }

  const questionResults: QuestionResult[] = [];
  let totalScore = 0;
  let autoGradeableQuestions = 0;
  let gradedQuestions = 0;

  // Process each question
  assignment.questions.forEach((question) => {
    const studentAnswer = answers.find(
      (a) => a.questionId === (question.id || question._id?.toString())
    );
    const isAutoGradeable = isQuestionAutoGradeable(question);

    if (isAutoGradeable) {
      autoGradeableQuestions++;
    }

    let isCorrect = false;
    let pointsEarned = 0;

    if (studentAnswer && isAutoGradeable) {
      isCorrect = checkAnswer(question, studentAnswer.answer);
      pointsEarned = isCorrect ? question.points : 0;
      totalScore += pointsEarned;
      gradedQuestions++;
    }

    questionResults.push({
      questionId: question.id || question._id?.toString() || "",
      questionText: question.question,
      questionType: question.type,
      studentAnswer: studentAnswer?.answer || "",
      correctAnswer: question.correctAnswer,
      isCorrect,
      pointsEarned,
      maxPoints: question.points,
      isAutoGradeable,
    });
  });

  // Generate feedback
  const feedback = generateAutoGradeFeedback(
    questionResults,
    totalScore,
    assignment.totalPoints
  );

  return {
    score: totalScore,
    maxScore: assignment.totalPoints,
    feedback,
    questionResults,
    canAutoGrade: autoGradeableQuestions > 0,
  };
};

/**
 * Check if a question can be auto-graded
 */
export const isQuestionAutoGradeable = (question: Question): boolean => {
  return (
    (question.type === "multiple_choice" || question.type === "true_false") &&
    question.correctAnswer !== undefined
  );
};

/**
 * Check if a student's answer is correct
 */
export const checkAnswer = (
  question: Question,
  studentAnswer: string | string[] | boolean | number
): boolean => {
  if (question.correctAnswer === undefined) {
    return false;
  }

  switch (question.type) {
    case "multiple_choice":
      return (
        String(studentAnswer).toLowerCase() ===
        String(question.correctAnswer).toLowerCase()
      );

    case "true_false":
      return (
        String(studentAnswer).toLowerCase() ===
        String(question.correctAnswer).toLowerCase()
      );

    default:
      return false;
  }
};

/**
 * Generate feedback based on auto-grading results
 */
export const generateAutoGradeFeedback = (
  questionResults: QuestionResult[],
  score: number,
  maxScore: number
): string => {
  const percentage = (score / maxScore) * 100;
  const autoGradeableQuestions = questionResults.filter(
    (q) => q.isAutoGradeable
  );
  const correctAnswers = autoGradeableQuestions.filter((q) => q.isCorrect);

  let feedback = `Auto-graded: ${score}/${maxScore} points (${percentage.toFixed(
    1
  )}%)\n\n`;

  if (autoGradeableQuestions.length > 0) {
    feedback += `Automatically graded questions: ${correctAnswers.length}/${autoGradeableQuestions.length} correct\n`;
  }

  const essayQuestions = questionResults.filter(
    (q) => q.questionType === "essay"
  );
  if (essayQuestions.length > 0) {
    feedback += `\nNote: ${essayQuestions.length} essay question(s) require manual grading.\n`;
  }

  // Performance feedback
  if (percentage >= 90) {
    feedback += "\nExcellent work! 🎉";
  } else if (percentage >= 80) {
    feedback += "\nGood job! 👍";
  } else if (percentage >= 70) {
    feedback += "\nNice effort! Keep practicing. 📚";
  } else if (percentage >= 60) {
    feedback +=
      "\nYou're on the right track. Review the material and try again. 💪";
  } else {
    feedback +=
      "\nPlease review the material carefully and consider asking for help. 🤝";
  }

  return feedback;
};

/**
 * Calculate auto-gradeable points for an assignment
 */
export const calculateAutoGradeablePoints = (
  assignment: Assignment
): number => {
  if (!assignment.questions) return 0;

  return assignment.questions
    .filter((q) => isQuestionAutoGradeable(q))
    .reduce((total, q) => total + q.points, 0);
};

/**
 * Get statistics about auto-gradeable vs manual questions
 */
export const getGradingStats = (assignment: Assignment) => {
  if (!assignment.questions) {
    return {
      totalQuestions: 0,
      autoGradeableQuestions: 0,
      manualQuestions: 0,
      autoGradeablePoints: 0,
      manualPoints: 0,
      totalPoints: assignment.totalPoints,
    };
  }

  const autoGradeableQuestions = assignment.questions.filter((q) =>
    isQuestionAutoGradeable(q)
  );
  const manualQuestions = assignment.questions.filter(
    (q) => !isQuestionAutoGradeable(q)
  );

  return {
    totalQuestions: assignment.questions.length,
    autoGradeableQuestions: autoGradeableQuestions.length,
    manualQuestions: manualQuestions.length,
    autoGradeablePoints: autoGradeableQuestions.reduce(
      (sum, q) => sum + q.points,
      0
    ),
    manualPoints: manualQuestions.reduce((sum, q) => sum + q.points, 0),
    totalPoints: assignment.totalPoints,
  };
};

/**
 * Validate submission before auto-grading
 */
export const validateSubmissionForAutoGrading = (
  assignment: Assignment,
  submission: Submission
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!assignment.questions || assignment.questions.length === 0) {
    errors.push("Assignment has no questions");
  }

  if (!submission.answers || submission.answers.length === 0) {
    errors.push("Submission has no answers");
  }

  const autoGradeableQuestions =
    assignment.questions?.filter((q) => isQuestionAutoGradeable(q)) || [];
  if (autoGradeableQuestions.length === 0) {
    errors.push("Assignment has no auto-gradeable questions");
  }

  // Check if all auto-gradeable questions have answers
  const answeredQuestionIds =
    submission.answers?.map((a) => a.questionId) || [];
  const missingAnswers = autoGradeableQuestions.filter(
    (q) => !answeredQuestionIds.includes(q.id || "")
  );

  if (missingAnswers.length > 0) {
    errors.push(
      `Missing answers for ${missingAnswers.length} auto-gradeable question(s)`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export default {
  autoGradeSubmission,
  isQuestionAutoGradeable,
  checkAnswer,
  generateAutoGradeFeedback,
  calculateAutoGradeablePoints,
  getGradingStats,
  validateSubmissionForAutoGrading,
};
