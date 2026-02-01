// PDF Receipt Generation for Custody Transfers
// Uses @react-pdf/renderer for server-side PDF generation

import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import type { DocumentProps } from '@react-pdf/renderer';
import QRCode from 'qrcode';

// PDF Styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottom: '2pt solid #000',
    paddingBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#000',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    width: '40%',
    fontWeight: 'bold',
  },
  value: {
    width: '60%',
  },
  signatureBox: {
    border: '1pt solid #000',
    height: 80,
    marginTop: 10,
    padding: 10,
  },
  signatureImage: {
    maxHeight: 60,
    objectFit: 'contain',
  },
  signatureLine: {
    borderTop: '1pt solid #000',
    marginTop: 40,
    paddingTop: 5,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTop: '1pt solid #000',
    paddingTop: 10,
    fontSize: 8,
    color: '#666',
  },
  qrCode: {
    width: 100,
    height: 100,
    position: 'absolute',
    right: 40,
    top: 40,
  },
  grid: {
    flexDirection: 'row',
    gap: 20,
  },
  gridCol: {
    flex: 1,
  },
});

export interface TransferReceiptData {
  receipt_number: string;
  transfer_date: string;
  transfer_type: string;
  transfer_reason: string;
  evidence: {
    case_number: string;
    item_number: string;
    description: string;
    item_type?: string;
  };
  from: {
    custodian?: string;
    location?: string;
    signature?: string;
  };
  to: {
    custodian?: string;
    location?: string;
    signature?: string;
  };
  condition_notes?: string;
  transfer_notes?: string;
  initiated_by: string;
}

export async function generateQRCode(data: string): Promise<string> {
  try {
    return await QRCode.toDataURL(data, {
      width: 200,
      margin: 1,
    });
  } catch (err) {
    console.error('Failed to generate QR code:', err);
    return '';
  }
}

export function CustodyTransferReceipt(data: TransferReceiptData): React.ReactElement<DocumentProps> {
  const qrCodeData = `RECEIPT:${data.receipt_number}|CASE:${data.evidence.case_number}|ITEM:${data.evidence.item_number}`;
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>CHAIN OF CUSTODY TRANSFER RECEIPT</Text>
          <Text style={styles.subtitle}>Evidence Property Manager</Text>
        </View>

        {/* Receipt Info */}
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Receipt Number:</Text>
            <Text style={styles.value}>{data.receipt_number}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Transfer Date:</Text>
            <Text style={styles.value}>{new Date(data.transfer_date).toLocaleString()}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Transfer Type:</Text>
            <Text style={styles.value}>{data.transfer_type.toUpperCase()}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Reason:</Text>
            <Text style={styles.value}>{data.transfer_reason}</Text>
          </View>
        </View>

        {/* Evidence Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>EVIDENCE ITEM</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Case Number:</Text>
            <Text style={styles.value}>{data.evidence.case_number}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Item Number:</Text>
            <Text style={styles.value}>{data.evidence.item_number}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Description:</Text>
            <Text style={styles.value}>{data.evidence.description}</Text>
          </View>
          {data.evidence.item_type && (
            <View style={styles.row}>
              <Text style={styles.label}>Item Type:</Text>
              <Text style={styles.value}>{data.evidence.item_type}</Text>
            </View>
          )}
        </View>

        {/* Transfer Details */}
        <View style={styles.grid}>
          <View style={[styles.section, styles.gridCol]}>
            <Text style={styles.sectionTitle}>FROM</Text>
            {data.from.custodian && (
              <View style={styles.row}>
                <Text style={styles.label}>Custodian:</Text>
                <Text style={styles.value}>{data.from.custodian}</Text>
              </View>
            )}
            {data.from.location && (
              <View style={styles.row}>
                <Text style={styles.label}>Location:</Text>
                <Text style={styles.value}>{data.from.location}</Text>
              </View>
            )}
            
            {data.from.signature ? (
              <View style={styles.signatureBox}>
                <Image src={data.from.signature} style={styles.signatureImage} />
                <Text style={styles.signatureLine}>Releasing Signature</Text>
              </View>
            ) : (
              <View style={styles.signatureBox}>
                <Text>_____________________________</Text>
                <Text style={styles.signatureLine}>Releasing Signature</Text>
              </View>
            )}
          </View>

          <View style={[styles.section, styles.gridCol]}>
            <Text style={styles.sectionTitle}>TO</Text>
            {data.to.custodian && (
              <View style={styles.row}>
                <Text style={styles.label}>Custodian:</Text>
                <Text style={styles.value}>{data.to.custodian}</Text>
              </View>
            )}
            {data.to.location && (
              <View style={styles.row}>
                <Text style={styles.label}>Location:</Text>
                <Text style={styles.value}>{data.to.location}</Text>
              </View>
            )}
            
            {data.to.signature ? (
              <View style={styles.signatureBox}>
                <Image src={data.to.signature} style={styles.signatureImage} />
                <Text style={styles.signatureLine}>Receiving Signature</Text>
              </View>
            ) : (
              <View style={styles.signatureBox}>
                <Text>_____________________________</Text>
                <Text style={styles.signatureLine}>Receiving Signature</Text>
              </View>
            )}
          </View>
        </View>

        {/* Condition & Notes */}
        {(data.condition_notes || data.transfer_notes) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>NOTES</Text>
            {data.condition_notes && (
              <View style={styles.row}>
                <Text style={styles.label}>Condition:</Text>
                <Text style={styles.value}>{data.condition_notes}</Text>
              </View>
            )}
            {data.transfer_notes && (
              <View style={styles.row}>
                <Text style={styles.label}>Transfer Notes:</Text>
                <Text style={styles.value}>{data.transfer_notes}</Text>
              </View>
            )}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Initiated by: {data.initiated_by}</Text>
          <Text>This is an official chain of custody record. Unauthorized modification is prohibited.</Text>
        </View>
      </Page>
    </Document>
  );
}

// Helper function to generate PDF buffer (for API routes)
export async function generateTransferReceiptPDF(data: TransferReceiptData): Promise<Buffer> {
  const { renderToBuffer } = await import('@react-pdf/renderer');
  const doc = CustodyTransferReceipt(data);
  return await renderToBuffer(doc);
}
