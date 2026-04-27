import cv2
import numpy as np
def detect_femur_length(image):
    gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
    clahe = cv2.createCLAHE(2.0, (8,8))
    gray = clahe.apply(gray)
    blur = cv2.GaussianBlur(gray, (5,5), 0)
    edges = cv2.Canny(blur, 50, 150)
    lines = cv2.HoughLinesP(
        edges,
        1,
        np.pi/180,
        threshold=80,
        minLineLength=80,
        maxLineGap=10
    )
    if lines is None:
        return None
    max_len = 0
    for line in lines:
        x1, y1, x2, y2 = line[0]
        dx = x2 - x1
        dy = y2 - y1
        length = np.hypot(dx, dy)
        angle = abs(np.degrees(np.arctan2(dy, dx)))
        if angle < 15 or angle > 165:
            continue
        if length > max_len:
            max_len = length
    if max_len < 100 or max_len > 320:
        return None
    return max_len
