# **App Name**: ScanVerify

## Core Features:

- Camera Initialization: Initiate the device's camera to capture video.
- Real-Time Barcode Scanning: Process camera frames to detect and decode barcode serial numbers in real time.
- Barcode Recognition: Use OCR or other image recognition tool to reliably detect and extract serial numbers from barcodes in the video feed.
- Status Indication: Visually highlight detected barcodes with a color-coded frame, which changes based on validation status. Orange for pending validation, green for approved, and red for rejected.
- Duplicate Scan Prevention: Prevent redundant queries by tracking previously scanned and validated barcodes. User will receive feedback of some kind when attemping to scan an already-validated code.

## Style Guidelines:

- Primary color: Forest green (#32CD32) to evoke trust, security, and success.
- Background color: Very light grayish-green (#F0F8F0), a softened shade of the primary color for a bright feel that isn't tiring.
- Accent color: Teal (#008080) for interactive elements; stands out against the green hues.
- Font: 'Inter', a sans-serif font, for clear readability of serial numbers and validation messages.
- Use simple, geometric icons to represent status and actions (e.g., checkmark for validated, cross for rejected).
- Prioritize camera feed display with a clean, minimal interface, and ensure barcode frames and status indicators are clearly visible.
- Use subtle transitions and animations when the validation status of a barcode changes.