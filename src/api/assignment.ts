import { Assignment, Submission, Answer } from "../types/assignment";
import axiosInstance from "./axiosInstance";

export const getAssignmentsByCourse = async (
  courseId: string
): Promise<{ data: { rows: Assignment[] }; rowCount?: number }> => {
  const res = await axiosInstance.get(`/assignments/course/${courseId}`);
  return res.data;
};

export const getAssignmentsByLesson = async (
  lessonId: string
): Promise<{ data: { rows: Assignment[] }; rowCount?: number }> => {
  const res = await axiosInstance.post("/assignments/lesson", { lessonId });
  return res.data;
};

export const getAssignmentDetail = async (id: string): Promise<Assignment> => {
  const res = await axiosInstance.get(`/assignments/${id}`);
  return res.data;
};

export const createAssignment = async (
  data: Partial<Assignment>
): Promise<any> => {
  const res = await axiosInstance.post("/assignments/create", data);
  return res.data;
};

export const updateAssignment = async (
  id: string,
  data: Partial<Assignment>
): Promise<any> => {
  const res = await axiosInstance.put(`/assignments/${id}`, data);
  return res.data;
};

// Student submission APIs
export const submitAssignment = async (
  assignmentId: string,
  answers: Answer[]
): Promise<{
  success: boolean;
  message: string;
  autoGraded?: boolean;
  score?: number;
  feedback?: string;
  maxScore?: number;
  autoGradeableScore?: number;
  submissionId?: string;
}> => {
  try {
    // Validate input
    if (!assignmentId || !answers || answers.length === 0) {
      throw new Error("Assignment ID and answers are required");
    }

    // Get assignment details first to perform client-side validation
    const assignmentRes = await getAssignmentDetail(assignmentId);
    const assignment = (assignmentRes as any).data || assignmentRes;

    if (!assignment) {
      throw new Error("Assignment not found");
    }

    if (!assignment.isPublished) {
      throw new Error("Assignment is not published");
    }

    // Check if due date has passed
    if (assignment.dueDate && new Date() > new Date(assignment.dueDate)) {
      throw new Error("Assignment due date has passed");
    }

    // Perform auto-grading calculation
    let totalScore = 0;
    let autoGradeableScore = 0;
    let maxAutoGradeablePoints = 0;
    let autoGradedQuestions = 0;
    let totalAutoGradeableQuestions = 0;

    const gradingResults = answers.map((answer) => {
      const question = assignment.questions?.find(
        (q: any) => (q._id?.toString() || q.id) === answer.questionId
      );

      if (question) {
        let isCorrect = false;
        let canAutoGrade = false;

        // Check answer based on question type
        switch (question.type) {
          case "multiple_choice":
            canAutoGrade = true;
            totalAutoGradeableQuestions++;
            maxAutoGradeablePoints += question.points;
            isCorrect = answer.answer === question.correctAnswer;
            break;

          case "true_false":
            canAutoGrade = true;
            totalAutoGradeableQuestions++;
            maxAutoGradeablePoints += question.points;
            isCorrect =
              String(answer.answer).toLowerCase() ===
              String(question.correctAnswer).toLowerCase();
            break;

          case "essay":
            // Essays cannot be auto-graded, require manual grading
            canAutoGrade = false;
            break;

          default:
            canAutoGrade = false;
        }

        if (canAutoGrade && isCorrect) {
          const pointsEarned = question.points;
          totalScore += pointsEarned;
          autoGradeableScore += pointsEarned;
          autoGradedQuestions++;
        }

        return {
          questionId: answer.questionId,
          answer: answer.answer,
          isCorrect,
          canAutoGrade,
          pointsEarned: canAutoGrade && isCorrect ? question.points : 0,
          maxPoints: question.points,
        };
      }

      return {
        questionId: answer.questionId,
        answer: answer.answer,
        isCorrect: false,
        canAutoGrade: false,
        pointsEarned: 0,
        maxPoints: 0,
      };
    });

    // Generate auto-grade feedback
    let feedback = "";
    if (totalAutoGradeableQuestions > 0) {
      const percentage = (autoGradeableScore / maxAutoGradeablePoints) * 100;
      feedback = `Auto-graded: ${autoGradedQuestions}/${totalAutoGradeableQuestions} correct (${percentage.toFixed(
        1
      )}%)`;

      if (percentage >= 90) {
        feedback += " - Excellent work! 🎉";
      } else if (percentage >= 80) {
        feedback += " - Good job! 👍";
      } else if (percentage >= 70) {
        feedback += " - Nice effort! Keep practicing. 📚";
      } else if (percentage >= 60) {
        feedback += " - You're on the right track. Review the material. 💪";
      } else {
        feedback += " - Please review the material carefully. 🤝";
      }
    }

    const essayQuestions =
      assignment.questions?.filter((q: any) => q.type === "essay").length || 0;
    if (essayQuestions > 0) {
      feedback += `\n\nNote: ${essayQuestions} essay question(s) require manual grading.`;
    }

    // Submit to backend
    const res = await axiosInstance.post(
      `/assignments/${assignmentId}/submit`,
      {
        answers,
        autoGradeData: {
          totalScore,
          autoGradeableScore,
          maxAutoGradeablePoints,
          autoGradedQuestions,
          totalAutoGradeableQuestions,
          feedback,
          gradingResults,
        },
      }
    );

    // Enhance response with auto-grading info
    const response = res.data;
    return {
      success: response.success || true,
      message: response.message || "Assignment submitted successfully",
      autoGraded: totalAutoGradeableQuestions > 0,
      score: totalScore,
      feedback: feedback,
      maxScore: assignment.totalPoints,
      autoGradeableScore,
      submissionId: response.submissionId || response.data?.id,
    };
  } catch (error: any) {
    console.error("Error submitting assignment:", error);
    throw error;
  }
};

export const getSubmissionDetail = async (
  assignmentId: string
): Promise<Submission> => {
  const res = await axiosInstance.get(
    `/assignments/${assignmentId}/submission`
  );
  return res.data;
};

export const getStudentSubmissions = async (): Promise<any> => {
  const res = await axiosInstance.get("/assignments/student/submissions");
  return res.data;
};

// Instructor grading APIs
export const getAssignmentSubmissions = async (
  assignmentId: string
): Promise<any> => {
  const res = await axiosInstance.get(
    `/assignments/${assignmentId}/submissions`
  );
  return res.data;
};

export const gradeSubmission = async (
  submissionId: string,
  data: { grade: number; feedback?: string }
): Promise<any> => {
  const res = await axiosInstance.put(
    `/assignments/submission/${submissionId}/grade`,
    data
  );
  return res.data;
};

// Auto-grade submission for multiple choice and true/false questions
export const autoGradeSubmission = async (
  submissionId: string,
  instructorId: string
): Promise<Submission | null> => {
  const res = await axiosInstance.post(
    `/assignments/submission/${submissionId}/auto-grade`,
    { instructorId }
  );
  return res.data;
};

// Get detailed submission with student info and answers
export const getSubmissionDetailWithAnswers = async (
  submissionId: string
): Promise<any> => {
  const res = await axiosInstance.post(
    `/assignments/submission/${submissionId}/detail`
  );
  return res.data;
};

export const deleteAssignment = async (id: string): Promise<any> => {
  const res = await axiosInstance.delete(`/assignments/${id}`);
  return res.data;
};

// Delete a student's submission for an assignment (retake)
export const deleteSubmissionByAssignment = async (
  assignmentId: string
): Promise<{ success: boolean; message: string }> => {
  const res = await axiosInstance.delete(
    `/assignments/${assignmentId}/submission`
  );
  return res.data;
};

// Get assignments with pagination for AG Grid
export const getAssignmentsGrid = async (params: {
  startRow: number;
  endRow: number;
  sortModel?: any[];
  filterModel?: any;
}): Promise<{
  success: boolean;
  data: {
    rows: Assignment[];
    rowCount: number;
    lastRow: number;
  };
}> => {
  const { startRow, endRow, sortModel, filterModel } = params;
  const pageSize = endRow - startRow;
  const page = Math.floor(startRow / pageSize) + 1;

  const payload = {
    page,
    pageSize,
    sortModel,
    filterModel,
  };

  try {
    const res = await axiosInstance.post("/assignments", payload);

    // Handle the specific response format from your API
    if (
      res.data &&
      res.data.message &&
      res.data.data &&
      Array.isArray(res.data.data)
    ) {
      const assignments = res.data.data;
      return {
        success: true,
        data: {
          rows: assignments,
          rowCount: assignments.length,
          lastRow: assignments.length,
        },
      };
    } else if (
      res.data &&
      res.data.success &&
      res.data.data &&
      res.data.data.rows
    ) {
      // Response already in AG Grid format
      console.log("Response already in AG Grid format");
      return res.data;
    } else if (res.data && Array.isArray(res.data)) {
      // Response is direct array
      console.log("Response is direct array");
      return {
        success: true,
        data: {
          rows: res.data,
          rowCount: res.data.length,
          lastRow: res.data.length,
        },
      };
    } else {
      console.error("Unexpected response format:", res.data);
      console.log("Response keys:", Object.keys(res.data || {}));
      throw new Error(
        `Invalid response format. Expected {message, data} but got: ${JSON.stringify(
          res.data
        )}`
      );
    }
  } catch (error) {

    // Fallback with sample data for debugging
    console.log("Using fallback sample data");
    const sampleData: Assignment[] = [
      {
        _id: "68a296322758691b50ad7fa8",
        courseId: "687a274ee32e3b9e19d7a4df",
        title: "JavaScript Basics Quiz",
        description: "Bài tập trắc nghiệm về kiến thức cơ bản của JavaScript.",
        totalPoints: 10,
        dueDate: "2025-08-30T23:59:59.000Z",
        isPublished: true,
      },
    ];

    return {
      success: true,
      data: {
        rows: sampleData,
        rowCount: sampleData.length,
        lastRow: sampleData.length,
      },
    };
  }
};
