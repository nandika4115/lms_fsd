import React, { useState } from 'react';
import { Card, Button, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const pastelColors = ['#E8F5E9', '#E3F2FD', '#FFF3E0'];

function CourseCard({
  course,
  index,
  isEnrolled,
  status,
  user,
  onEnroll,
  showResume,
  resumeLink,
  showEnroll,
  showDetails = true,
  customIcon
}) {
  const bgColor = pastelColors[index % pastelColors.length];
  const [expanded, setExpanded] = useState(false);

  return (
    <Card
      className="course-card-new shadow-sm mb-4 h-100"
      style={{ backgroundColor: bgColor }}
    >
      {/* Thumbnail Image */}
      {course.thumbnail_url && (
        <div className="thumbnail-container">
          <img
            src={course.thumbnail_url}
            alt={course.title}
            className="card-img-top course-thumbnail"
            loading="lazy"
          />
        </div>
      )}

      <Card.Body className="d-flex flex-column">
        <Card.Title as="h5" className="fw-bold course-card-title">
          {course.title}
        </Card.Title>

        {/* Truncated description with Read More */}
        <Card.Text
          className={`course-card-text ${expanded ? 'expanded' : 'truncated'}`}
        >
          {course.description}
        </Card.Text>

        {course.description?.length > 120 && (
          <div className="read-more-wrapper">
            <Button
              variant="link"
              className="p-0 read-more-btn"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? 'Read Less' : 'Read More'}
            </Button>
          </div>
        )}

        {/* Buttons */}
        <div className="mt-auto d-flex flex-column gap-2">
          {isEnrolled ? (
            <>
              <Button
                variant="success"
                className="w-100 enrolled-btn"
                disabled
              >
                Enrolled
              </Button>
              <div className="d-flex gap-2">
                {showDetails && (
                  <Button
                    as={Link}
                    to={`/courses/${course.id}`}
                    variant="dark"
                    className="w-50"
                  >
                    View
                  </Button>
                )}
                {showResume && resumeLink && (
                  <Button
                    as={Link}
                    to={resumeLink}
                    variant="dark"
                    className="w-50"
                  >
                    Resume
                  </Button>
                )}
              </div>
            </>
          ) : (
            <>
              {status && (
                <Alert variant={status.type} className="py-2 mb-2">
                  {status.message}
                </Alert>
              )}
              {showDetails && (
                <Button
                  as={Link}
                  to={`/courses/${course.id}`}
                  variant="dark"
                  className="w-100 mb-2"
                >
                  View Details
                </Button>
              )}
              {showEnroll && user && user.role === 'student' && (
                <Button
                  variant="success"
                  className="w-100"
                  onClick={() => onEnroll && onEnroll(course.id)}
                  disabled={status?.type === 'info' || status?.type === 'success'}
                >
                  {status?.type === 'info' ? 'Enrolling...' : 'Enroll'}
                </Button>
              )}
            </>
          )}
        </div>
      </Card.Body>
    </Card>
  );
}

export default CourseCard;
