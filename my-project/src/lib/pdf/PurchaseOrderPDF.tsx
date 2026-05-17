import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

// --- Types ---

export interface PurchaseOrderPDFItem {
  productName: string;
  sku: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

export interface PurchaseOrderPDFSupplier {
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
}

export interface PurchaseOrderPDFData {
  id: string;
  poNumber: string;
  status: string;
  orderDate: Date;
  expectedDelivery: Date | null;
  totalAmount: number;
  notes: string | null;
  items: PurchaseOrderPDFItem[];
  supplier: PurchaseOrderPDFSupplier | null;
}

export interface PurchaseOrderPDFProps {
  po: PurchaseOrderPDFData;
  shopName: string;
  shopAddress?: string | null;
}

const COLORS = {
  background: "#F5F0E8",
  surface: "#FFFFFF",
  terracotta: "#CC785C",
  sand: "#D4A574",
  textPrimary: "#2D2825",
  textSecondary: "#736B66",
  border: "#E8E0D5",
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: COLORS.surface,
    padding: 40,
    fontSize: 10,
    color: COLORS.textPrimary,
    fontFamily: "Helvetica",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.terracotta,
    paddingBottom: 12,
  },
  shopName: {
    fontSize: 22,
    color: COLORS.terracotta,
    fontFamily: "Helvetica-Bold",
  },
  shopTagline: {
    fontSize: 9,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  docLabel: {
    fontSize: 20,
    color: COLORS.textPrimary,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 2,
  },
  metaBox: {
    backgroundColor: COLORS.background,
    padding: 12,
    marginBottom: 20,
    borderRadius: 4,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 4,
  },
  metaLabel: {
    color: COLORS.textSecondary,
    width: 110,
    textAlign: "right",
    marginRight: 8,
  },
  metaValue: {
    color: COLORS.textPrimary,
    fontFamily: "Helvetica-Bold",
    width: 140,
    textAlign: "right",
  },
  partiesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  partyBox: {
    width: "48%",
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: COLORS.terracotta,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  partyName: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  partyText: {
    fontSize: 10,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  table: {
    marginTop: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: COLORS.terracotta,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  tableHeaderText: {
    color: COLORS.surface,
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  tableRowAlt: {
    backgroundColor: COLORS.background,
  },
  colProduct: { flex: 3 },
  colSku: { flex: 2 },
  colQty: { flex: 1, textAlign: "right" },
  colUnitCost: { flex: 1.5, textAlign: "right" },
  colTotal: { flex: 1.5, textAlign: "right" },
  totalsBox: {
    alignSelf: "flex-end",
    width: 240,
    marginTop: 8,
  },
  totalsRowFinal: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderTopWidth: 2,
    borderTopColor: COLORS.terracotta,
    marginTop: 4,
  },
  grandTotalLabel: {
    color: COLORS.terracotta,
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
  },
  grandTotalValue: {
    color: COLORS.terracotta,
    fontFamily: "Helvetica-Bold",
    fontSize: 14,
  },
  notesBox: {
    marginTop: 16,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.sand,
    backgroundColor: COLORS.background,
  },
  notesText: {
    fontSize: 9,
    color: COLORS.textSecondary,
    lineHeight: 1.5,
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    textAlign: "center",
    color: COLORS.textSecondary,
    fontSize: 9,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 8,
  },
  pageNumber: {
    position: "absolute",
    bottom: 20,
    right: 40,
    fontSize: 8,
    color: COLORS.textSecondary,
  },
});

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function formatDate(d: Date | null): string {
  if (!d) return "—";
  const date = new Date(d);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function PurchaseOrderPDF(
  props: PurchaseOrderPDFProps
): React.ReactElement {
  const { po, shopName, shopAddress } = props;

  return (
    <Document
      title={`Purchase Order ${po.poNumber}`}
      author={shopName}
      subject="Purchase Order"
    >
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.shopName}>{shopName}</Text>
            <Text style={styles.shopTagline}>B2B Wholesale &amp; Supply</Text>
          </View>
          <Text style={styles.docLabel}>PURCHASE ORDER</Text>
        </View>

        {/* Meta */}
        <View style={styles.metaBox}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>PO #</Text>
            <Text style={styles.metaValue}>{po.poNumber}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Order Date</Text>
            <Text style={styles.metaValue}>{formatDate(po.orderDate)}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Expected Delivery</Text>
            <Text style={styles.metaValue}>
              {formatDate(po.expectedDelivery)}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Status</Text>
            <Text style={styles.metaValue}>{po.status}</Text>
          </View>
        </View>

        {/* Vendor + Ship To */}
        <View style={styles.partiesRow}>
          <View style={styles.partyBox}>
            <Text style={styles.sectionTitle}>Vendor</Text>
            {po.supplier ? (
              <View>
                <Text style={styles.partyName}>{po.supplier.name}</Text>
                {po.supplier.address ? (
                  <Text style={styles.partyText}>{po.supplier.address}</Text>
                ) : null}
                {po.supplier.email ? (
                  <Text style={styles.partyText}>{po.supplier.email}</Text>
                ) : null}
                {po.supplier.phone ? (
                  <Text style={styles.partyText}>{po.supplier.phone}</Text>
                ) : null}
              </View>
            ) : (
              <Text style={styles.partyText}>—</Text>
            )}
          </View>
          <View style={styles.partyBox}>
            <Text style={styles.sectionTitle}>Ship To</Text>
            <Text style={styles.partyName}>{shopName}</Text>
            {shopAddress ? (
              <Text style={styles.partyText}>{shopAddress}</Text>
            ) : null}
          </View>
        </View>

        {/* Items */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colProduct]}>
              Product
            </Text>
            <Text style={[styles.tableHeaderText, styles.colSku]}>SKU</Text>
            <Text style={[styles.tableHeaderText, styles.colQty]}>Qty</Text>
            <Text style={[styles.tableHeaderText, styles.colUnitCost]}>
              Unit Cost
            </Text>
            <Text style={[styles.tableHeaderText, styles.colTotal]}>
              Total Cost
            </Text>
          </View>
          {po.items.map(function renderRow(item, idx) {
            const rowStyle =
              idx % 2 === 1
                ? [styles.tableRow, styles.tableRowAlt]
                : [styles.tableRow];
            return (
              <View key={`po-item-${idx}`} style={rowStyle}>
                <Text style={styles.colProduct}>{item.productName}</Text>
                <Text style={styles.colSku}>{item.sku}</Text>
                <Text style={styles.colQty}>{item.quantity}</Text>
                <Text style={styles.colUnitCost}>
                  {formatCurrency(item.unitCost)}
                </Text>
                <Text style={styles.colTotal}>
                  {formatCurrency(item.totalCost)}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Total */}
        <View style={styles.totalsBox}>
          <View style={styles.totalsRowFinal}>
            <Text style={styles.grandTotalLabel}>TOTAL</Text>
            <Text style={styles.grandTotalValue}>
              {formatCurrency(po.totalAmount)}
            </Text>
          </View>
        </View>

        {/* Notes */}
        {po.notes ? (
          <View style={styles.notesBox}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notesText}>{po.notes}</Text>
          </View>
        ) : null}

        {/* Footer */}
        <Text style={styles.footer} fixed>
          {`PO ${po.poNumber}`}
        </Text>
        <Text
          style={styles.pageNumber}
          render={function renderPageNumber(pageInfo: {
            pageNumber: number;
            totalPages: number;
          }): string {
            return `Page ${pageInfo.pageNumber} of ${pageInfo.totalPages}`;
          }}
          fixed
        />
      </Page>
    </Document>
  );
}
