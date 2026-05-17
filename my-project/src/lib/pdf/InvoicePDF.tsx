import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

// --- Types ---

export interface InvoicePDFItem {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface InvoicePDFPayment {
  amount: number;
  paymentDate: Date;
  paymentMethod: string;
}

export interface InvoicePDFCustomer {
  companyName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
}

export interface InvoicePDFData {
  id: string;
  invoiceNumber: string;
  status: string;
  issueDate: Date;
  dueDate: Date;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  notes: string | null;
  items: InvoicePDFItem[];
  customer: InvoicePDFCustomer | null;
  payments: InvoicePDFPayment[];
}

export interface InvoicePDFProps {
  invoice: InvoicePDFData;
  shopName: string;
}

// --- สีตาม Design System ---
const COLORS = {
  background: "#F5F0E8",
  surface: "#FFFFFF",
  terracotta: "#CC785C",
  sand: "#D4A574",
  textPrimary: "#2D2825",
  textSecondary: "#736B66",
  border: "#E8E0D5",
};

// --- Styles ---
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
  invoiceLabel: {
    fontSize: 24,
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
    width: 90,
    textAlign: "right",
    marginRight: 8,
  },
  metaValue: {
    color: COLORS.textPrimary,
    fontFamily: "Helvetica-Bold",
    width: 140,
    textAlign: "right",
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: COLORS.terracotta,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  billToBox: {
    marginBottom: 20,
  },
  billToText: {
    fontSize: 10,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  billToCompany: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: COLORS.textPrimary,
    marginBottom: 4,
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
  colDescription: { flex: 4 },
  colQty: { flex: 1, textAlign: "right" },
  colUnitPrice: { flex: 1.5, textAlign: "right" },
  colTotal: { flex: 1.5, textAlign: "right" },
  totalsBox: {
    alignSelf: "flex-end",
    width: 240,
    marginTop: 8,
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  totalsRowFinal: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderTopWidth: 2,
    borderTopColor: COLORS.terracotta,
    marginTop: 4,
  },
  totalsLabel: {
    color: COLORS.textSecondary,
  },
  totalsValue: {
    color: COLORS.textPrimary,
    fontFamily: "Helvetica-Bold",
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
  paymentsBox: {
    marginTop: 20,
    padding: 10,
    backgroundColor: COLORS.background,
    borderRadius: 4,
  },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
    fontSize: 9,
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

// --- Helpers ---

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function formatDate(d: Date): string {
  const date = new Date(d);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// --- Component ---

export function InvoicePDF(props: InvoicePDFProps): React.ReactElement {
  const { invoice, shopName } = props;

  return (
    <Document
      title={`Invoice ${invoice.invoiceNumber}`}
      author={shopName}
      subject="Invoice"
    >
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.shopName}>{shopName}</Text>
            <Text style={styles.shopTagline}>B2B Wholesale &amp; Supply</Text>
          </View>
          <Text style={styles.invoiceLabel}>INVOICE</Text>
        </View>

        {/* Meta Box */}
        <View style={styles.metaBox}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Invoice #</Text>
            <Text style={styles.metaValue}>{invoice.invoiceNumber}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Issue Date</Text>
            <Text style={styles.metaValue}>{formatDate(invoice.issueDate)}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Due Date</Text>
            <Text style={styles.metaValue}>{formatDate(invoice.dueDate)}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Status</Text>
            <Text style={styles.metaValue}>{invoice.status}</Text>
          </View>
        </View>

        {/* Bill To */}
        <View style={styles.billToBox}>
          <Text style={styles.sectionTitle}>Bill To</Text>
          {invoice.customer ? (
            <View>
              <Text style={styles.billToCompany}>
                {invoice.customer.companyName ?? "—"}
              </Text>
              {invoice.customer.address ? (
                <Text style={styles.billToText}>{invoice.customer.address}</Text>
              ) : null}
              {invoice.customer.email ? (
                <Text style={styles.billToText}>{invoice.customer.email}</Text>
              ) : null}
              {invoice.customer.phone ? (
                <Text style={styles.billToText}>{invoice.customer.phone}</Text>
              ) : null}
            </View>
          ) : (
            <Text style={styles.billToText}>—</Text>
          )}
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colDescription]}>
              Description
            </Text>
            <Text style={[styles.tableHeaderText, styles.colQty]}>Qty</Text>
            <Text style={[styles.tableHeaderText, styles.colUnitPrice]}>
              Unit Price
            </Text>
            <Text style={[styles.tableHeaderText, styles.colTotal]}>Total</Text>
          </View>
          {invoice.items.map(function renderRow(item, idx) {
            const rowStyle =
              idx % 2 === 1
                ? [styles.tableRow, styles.tableRowAlt]
                : [styles.tableRow];
            return (
              <View key={`item-${idx}`} style={rowStyle}>
                <Text style={styles.colDescription}>{item.description}</Text>
                <Text style={styles.colQty}>{item.quantity}</Text>
                <Text style={styles.colUnitPrice}>
                  {formatCurrency(item.unitPrice)}
                </Text>
                <Text style={styles.colTotal}>
                  {formatCurrency(item.totalPrice)}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Totals */}
        <View style={styles.totalsBox}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Subtotal</Text>
            <Text style={styles.totalsValue}>
              {formatCurrency(invoice.subtotal)}
            </Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Tax</Text>
            <Text style={styles.totalsValue}>
              {formatCurrency(invoice.taxAmount)}
            </Text>
          </View>
          <View style={styles.totalsRowFinal}>
            <Text style={styles.grandTotalLabel}>TOTAL</Text>
            <Text style={styles.grandTotalValue}>
              {formatCurrency(invoice.totalAmount)}
            </Text>
          </View>
        </View>

        {/* Payments */}
        {invoice.payments.length > 0 ? (
          <View style={styles.paymentsBox}>
            <Text style={styles.sectionTitle}>Payments Received</Text>
            {invoice.payments.map(function renderPayment(p, idx) {
              return (
                <View key={`pay-${idx}`} style={styles.paymentRow}>
                  <Text>{formatDate(p.paymentDate)}</Text>
                  <Text>{p.paymentMethod}</Text>
                  <Text>{formatCurrency(p.amount)}</Text>
                </View>
              );
            })}
          </View>
        ) : null}

        {/* Notes */}
        {invoice.notes ? (
          <View style={styles.notesBox}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        ) : null}

        {/* Footer */}
        <Text style={styles.footer} fixed>
          Thank you for your business
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
