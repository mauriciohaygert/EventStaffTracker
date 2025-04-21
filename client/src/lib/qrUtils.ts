/**
 * Utility functions for generating QR codes
 */

import QRCode from 'qrcode';

/**
 * Generate a QR code from data
 * @param data The data to encode in the QR code
 * @returns A promise that resolves to a data URL for the QR code
 */
export async function generateQRCode(data: string): Promise<string> {
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(data, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 300,
      color: {
        dark: '#3b82f6', // Blue color for the QR code
        light: '#ffffff'  // White background
      }
    });
    return qrCodeDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
}

/**
 * Generate a barcode for an employee
 * @param employeeId The employee ID to encode
 * @returns A promise that resolves to a data URL for the barcode
 */
export async function generateBarcode(employeeId: number): Promise<string> {
  try {
    const JsBarcode = (await import('jsbarcode')).default;
    
    // Create a canvas element to render the barcode
    const canvas = document.createElement('canvas');
    
    // Format the employee ID as a string with leading zeros
    const formattedId = `EMP${String(employeeId).padStart(4, '0')}`;
    
    // Generate the barcode
    JsBarcode(canvas, formattedId, {
      format: 'CODE128',
      lineColor: '#3b82f6',
      width: 2,
      height: 80,
      displayValue: true,
      fontSize: 14,
      font: 'Arial'
    });
    
    // Convert the canvas to a data URL
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error generating barcode:', error);
    throw error;
  }
}

/**
 * Generate an ID badge with QR code and barcode
 * @param employee The employee data
 * @returns A promise that resolves to a data URL for the badge
 */
export async function generateBadge(employee: any): Promise<string> {
  try {
    const qrCodeData = JSON.stringify({ employeeId: employee.id });
    const qrCodeUrl = await generateQRCode(qrCodeData);
    const barcodeUrl = await generateBarcode(employee.id);
    
    // Create a canvas to combine QR code and barcode
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    
    // Set badge dimensions
    canvas.width = 400;
    canvas.height = 600;
    
    // Draw background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw border
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 5;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
    
    // Draw header
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(10, 10, canvas.width - 20, 60);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('EventStaff', canvas.width / 2, 50);
    
    // Draw employee info
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(employee.name, canvas.width / 2, 100);
    
    ctx.font = '16px Arial';
    ctx.fillText(employee.role, canvas.width / 2, 130);
    ctx.fillText(`ID: EMP${String(employee.id).padStart(4, '0')}`, canvas.width / 2, 160);
    
    // Load and draw QR code
    const qrImage = new Image();
    qrImage.src = qrCodeUrl;
    await new Promise(resolve => {
      qrImage.onload = resolve;
    });
    ctx.drawImage(qrImage, (canvas.width - 200) / 2, 180, 200, 200);
    
    // Load and draw barcode
    const barcodeImage = new Image();
    barcodeImage.src = barcodeUrl;
    await new Promise(resolve => {
      barcodeImage.onload = resolve;
    });
    ctx.drawImage(barcodeImage, 50, 400, 300, 100);
    
    // Draw footer
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(10, canvas.height - 70, canvas.width - 20, 60);
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Arial';
    ctx.fillText('Scanear para registro de ponto', canvas.width / 2, canvas.height - 40);
    ctx.fillText(new Date().getFullYear().toString(), canvas.width / 2, canvas.height - 20);
    
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error generating badge:', error);
    throw error;
  }
}
