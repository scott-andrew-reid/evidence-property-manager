import { jsPDF } from 'jspdf'
import QRCode from 'qrcode'

interface TransferReceiptData {
  receipt_number: string
  transfer_date: string
  transfer_type: string
  transfer_reason: string
  items: Array<{
    case_number: string
    item_number: string
    item_type: string
    description?: string
  }>
  from_party: {
    type: string
    name: string
    location?: string
  }
  to_party: {
    type: string
    name: string
    location: string
  }
  notes?: string
  from_signature?: string
  to_signature?: string
}

export async function generateTransferReceipt(data: TransferReceiptData): Promise<string> {
  const doc = new jsPDF()
  
  // Header
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('EVIDENCE TRANSFER RECEIPT', 105, 20, { align: 'center' })
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Evidence Property Manager', 105, 27, { align: 'center' })
  
  // Receipt Details Box
  doc.setDrawColor(0)
  doc.setLineWidth(0.5)
  doc.rect(15, 35, 180, 25)
  
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('Receipt Number:', 20, 42)
  doc.setFont('helvetica', 'normal')
  doc.text(data.receipt_number, 60, 42)
  
  doc.setFont('helvetica', 'bold')
  doc.text('Date/Time:', 20, 48)
  doc.setFont('helvetica', 'normal')
  doc.text(data.transfer_date, 60, 48)
  
  doc.setFont('helvetica', 'bold')
  doc.text('Transfer Type:', 20, 54)
  doc.setFont('helvetica', 'normal')
  doc.text(data.transfer_type, 60, 54)
  
  doc.setFont('helvetica', 'bold')
  doc.text('Reason:', 120, 42)
  doc.setFont('helvetica', 'normal')
  const reasonText = doc.splitTextToSize(data.transfer_reason, 70)
  doc.text(reasonText, 145, 42)
  
  // Items Section
  let yPos = 70
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('ITEMS TRANSFERRED', 20, yPos)
  
  yPos += 7
  doc.setFontSize(9)
  
  data.items.forEach((item, index) => {
    if (yPos > 250) {
      doc.addPage()
      yPos = 20
    }
    
    doc.setFont('helvetica', 'bold')
    doc.text(`${index + 1}.`, 20, yPos)
    doc.text('Case:', 25, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(item.case_number, 40, yPos)
    
    doc.setFont('helvetica', 'bold')
    doc.text('Item:', 80, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(item.item_number, 95, yPos)
    
    doc.setFont('helvetica', 'bold')
    doc.text('Type:', 140, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(item.item_type, 155, yPos)
    
    if (item.description) {
      yPos += 5
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(8)
      const descLines = doc.splitTextToSize(item.description, 170)
      doc.text(descLines, 25, yPos)
      yPos += (descLines.length * 4)
      doc.setFontSize(9)
    }
    
    yPos += 6
  })
  
  // Transfer Details
  yPos += 5
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('TRANSFER DETAILS', 20, yPos)
  
  yPos += 7
  doc.setFontSize(9)
  
  // From Party
  doc.setFont('helvetica', 'bold')
  doc.text('FROM:', 20, yPos)
  yPos += 5
  doc.setFont('helvetica', 'normal')
  doc.text(`Party: ${data.from_party.name}`, 25, yPos)
  yPos += 5
  if (data.from_party.location) {
    doc.text(`Location: ${data.from_party.location}`, 25, yPos)
    yPos += 5
  }
  
  yPos += 3
  
  // To Party
  doc.setFont('helvetica', 'bold')
  doc.text('TO:', 20, yPos)
  yPos += 5
  doc.setFont('helvetica', 'normal')
  doc.text(`Party: ${data.to_party.name}`, 25, yPos)
  yPos += 5
  doc.text(`Location: ${data.to_party.location}`, 25, yPos)
  yPos += 5
  
  // Notes
  if (data.notes) {
    yPos += 3
    doc.setFont('helvetica', 'bold')
    doc.text('NOTES:', 20, yPos)
    yPos += 5
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    const notesLines = doc.splitTextToSize(data.notes, 170)
    doc.text(notesLines, 25, yPos)
    yPos += (notesLines.length * 4) + 3
    doc.setFontSize(9)
  }
  
  // Signatures
  yPos += 10
  if (yPos > 230) {
    doc.addPage()
    yPos = 20
  }
  
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('SIGNATURES', 20, yPos)
  yPos += 7
  
  // Signature boxes
  const sigBoxWidth = 75
  const sigBoxHeight = 30
  
  // From signature
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('Released By:', 20, yPos)
  yPos += 3
  doc.rect(20, yPos, sigBoxWidth, sigBoxHeight)
  
  if (data.from_signature) {
    try {
      doc.addImage(data.from_signature, 'PNG', 22, yPos + 2, sigBoxWidth - 4, sigBoxHeight - 4)
    } catch (e) {
      console.error('Failed to add from signature:', e)
    }
  }
  
  // To signature
  doc.setFont('helvetica', 'bold')
  doc.text('Received By:', 115, yPos - 3)
  doc.rect(115, yPos, sigBoxWidth, sigBoxHeight)
  
  if (data.to_signature) {
    try {
      doc.addImage(data.to_signature, 'PNG', 117, yPos + 2, sigBoxWidth - 4, sigBoxHeight - 4)
    } catch (e) {
      console.error('Failed to add to signature:', e)
    }
  }
  
  yPos += sigBoxHeight + 2
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.text(data.from_party.name, 20, yPos)
  doc.text(data.to_party.name, 115, yPos)
  
  // QR Code for verification
  yPos += 10
  try {
    const qrDataUrl = await QRCode.toDataURL(data.receipt_number, {
      width: 60,
      margin: 1
    })
    doc.addImage(qrDataUrl, 'PNG', 20, yPos, 20, 20)
    doc.setFontSize(7)
    doc.text('Scan to verify', 20, yPos + 23)
  } catch (e) {
    console.error('Failed to generate QR code:', e)
  }
  
  // Footer
  doc.setFontSize(7)
  doc.setFont('helvetica', 'italic')
  doc.text('This is an official chain of custody document.', 105, 285, { align: 'center' })
  doc.text('Evidence Property Manager - Generated automatically', 105, 290, { align: 'center' })
  
  // Return as data URL
  return doc.output('dataurlstring')
}
