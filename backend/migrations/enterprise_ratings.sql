CREATE TABLE IF NOT EXISTS enterprise_ratings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    enterprise_id INT NOT NULL,
    activity_id INT,
    user_type ENUM('LECTURER', 'STUDENT') DEFAULT 'LECTURER',
    overall_score INT NOT NULL,
    guidance_score INT,
    facilities_score INT,
    opportunities_score INT,
    coordination_score INT,
    internal_note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (enterprise_id) REFERENCES enterprises(id) ON DELETE CASCADE,
    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE SET NULL
);
