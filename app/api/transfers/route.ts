import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/schema';
import { getAuthUser } from '@/lib/auth';

// POST - Create transfer (handles both new and existing evidence)
export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();
    const sql = getDb();
    
    const { item_mode, new_items, existing_items, transfer_details } = data;
    
    const transferResults = [];

    // Handle NEW evidence items
    if (item_mode === 'new' && new_items && new_items.length > 0) {
      for (const newItem of new_items) {
        // 1. Create evidence item
        const evidenceResult = await sql`
          INSERT INTO evidence_items_v2 (
            case_number,
            item_number,
            item_type_id,
            description,
            collected_date,
            collected_by,
            current_status,
            current_location_id,
            current_custodian_id,
            created_by
          ) VALUES (
            ${newItem.case_number},
            ${newItem.item_number},
            ${newItem.item_type_id},
            ${newItem.description || 'New evidence item'},
            NOW(),
            ${transfer_details.from_party_name || 'Crime Scene'},
            'stored',
            ${transfer_details.to_location_id},
            ${transfer_details.to_party_id},
            ${user.userId}
          )
          RETURNING id
        `;

        const evidenceId = evidenceResult[0].id;

        // 2. Create custody transfer record
        const receiptNumber = `TXN-${evidenceId}-${Date.now()}`;
        
        await sql`
          INSERT INTO custody_transfers (
            evidence_item_id,
            transfer_type,
            transfer_reason_id,
            from_party_type,
            from_party_name,
            to_party_type,
            to_party_id,
            to_location_id,
            transfer_date,
            notes,
            receipt_number,
            created_by
          ) VALUES (
            ${evidenceId},
            'receipt',
            ${transfer_details.reason_id},
            'external',
            ${transfer_details.from_party_name || 'External source'},
            'analyst',
            ${transfer_details.to_party_id},
            ${transfer_details.to_location_id},
            NOW(),
            ${transfer_details.notes || ''},
            ${receiptNumber},
            ${user.userId}
          )
        `;

        // 3. Audit log
        await sql`
          INSERT INTO audit_log (user_id, action, table_name, record_id, details)
          VALUES (
            ${user.userId},
            'CREATE',
            'evidence_items_v2',
            ${evidenceId},
            ${JSON.stringify({ case_number: newItem.case_number, item_number: newItem.item_number, transfer: 'initial_receipt' })}
          )
        `;

        transferResults.push({
          evidence_id: evidenceId,
          receipt_number: receiptNumber,
          type: 'new'
        });
      }
    }

    // Handle EXISTING evidence items
    if (item_mode === 'existing' && existing_items && existing_items.length > 0) {
      for (const itemId of existing_items) {
        // 1. Get current item details
        const currentItem = await sql`
          SELECT * FROM evidence_items_v2 WHERE id = ${itemId} LIMIT 1
        `;

        if (currentItem.length === 0) {
          throw new Error(`Evidence item ${itemId} not found`);
        }

        const item = currentItem[0];

        // 2. Create custody transfer record
        const receiptNumber = `TXN-${itemId}-${Date.now()}`;
        
        await sql`
          INSERT INTO custody_transfers (
            evidence_item_id,
            transfer_type,
            transfer_reason_id,
            from_party_type,
            from_party_id,
            from_location_id,
            to_party_type,
            to_party_id,
            to_location_id,
            transfer_date,
            notes,
            receipt_number,
            created_by
          ) VALUES (
            ${itemId},
            'internal_transfer',
            ${transfer_details.reason_id},
            'analyst',
            ${item.current_custodian_id},
            ${item.current_location_id},
            'analyst',
            ${transfer_details.to_party_id},
            ${transfer_details.to_location_id},
            NOW(),
            ${transfer_details.notes || ''},
            ${receiptNumber},
            ${user.userId}
          )
        `;

        // 3. Update evidence item with new custodian/location
        await sql`
          UPDATE evidence_items_v2
          SET 
            current_custodian_id = ${transfer_details.to_party_id},
            current_location_id = ${transfer_details.to_location_id},
            updated_at = NOW()
          WHERE id = ${itemId}
        `;

        // 4. Audit log
        await sql`
          INSERT INTO audit_log (user_id, action, table_name, record_id, details)
          VALUES (
            ${user.userId},
            'TRANSFER',
            'evidence_items_v2',
            ${itemId},
            ${JSON.stringify({ 
              from_custodian: item.current_custodian_id,
              to_custodian: transfer_details.to_party_id,
              from_location: item.current_location_id,
              to_location: transfer_details.to_location_id
            })}
          )
        `;

        transferResults.push({
          evidence_id: itemId,
          receipt_number: receiptNumber,
          type: 'transfer'
        });
      }
    }

    return NextResponse.json({ 
      success: true, 
      transfers: transferResults,
      message: `Successfully processed ${transferResults.length} transfer(s)`
    });

  } catch (error: any) {
    console.error('Transfer failed:', error);
    return NextResponse.json({ error: error.message || 'Transfer failed' }, { status: 500 });
  }
}
