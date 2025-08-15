import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getLessonDetail } from "../../api/lesson";
import { useTranslation } from "react-i18next";

const LessonDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videoProgress, setVideoProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const fetchLesson = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getLessonDetail(id!);
        setLesson(res);
      } catch (err: any) {
        setError(t("lessonDetail.loadError"));
      } finally {
        setLoading(false);
      }
    };
    fetchLesson();
  }, [id, t]);

  // Auto complete when video watched >= 90%
  const handleTimeUpdate = () => {
    if (videoRef.current && lesson && !completed) {
      const percent =
        (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setVideoProgress(percent);
      if (percent >= 90) {
        // handleComplete();
      }
    }
  };

  //   const handleComplete = async () => {
  //     if (completed) return;
  //     try {
  //       await completeLesson(id!);
  //       setCompleted(true);
  //     } catch (err) {
  //       // handle error
  //     }
  //   };

  if (loading) return <div>{t("common.loading")}</div>;
  if (error) return <div className="text-danger">{error}</div>;
  if (!lesson) return null;

  return (
    <div className="container py-4">
      <h2 className="mb-3">{lesson.title}</h2>
      {lesson.videoUrl && (
        <div className="mb-3">
          <video
            ref={videoRef}
            src={lesson.videoUrl}
            controls
            width="100%"
            onTimeUpdate={handleTimeUpdate}
          />
          <div className="progress mt-2">
            <div
              className="progress-bar"
              role="progressbar"
              style={{ width: `${videoProgress}%` }}
              aria-valuenow={videoProgress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              {Math.floor(videoProgress)}%
            </div>
          </div>
        </div>
      )}
      <div className="mb-3">
        <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
      </div>
      {lesson.attachments && lesson.attachments.length > 0 && (
        <div className="mb-3">
          <h5>{t("lessonDetail.attachments")}</h5>
          <ul>
            {lesson.attachments.map((file: any, idx: number) => (
              <li key={idx}>
                <a href={file.url} target="_blank" rel="noopener noreferrer">
                  {file.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="d-flex gap-2">
        {lesson.quizId ? (
          <button
            className="btn btn-warning"
            onClick={() => navigate(`/assignments/${lesson.quizId}`)}
          >
            {t("lessonDetail.doQuiz")}
          </button>
        ) : (
          <button
            className="btn btn-success"
            disabled={completed}
            // onClick={handleComplete}
          >
            {completed
              ? t("lessonDetail.completed")
              : t("lessonDetail.complete")}
          </button>
        )}
      </div>
    </div>
  );
};

export default LessonDetail;
