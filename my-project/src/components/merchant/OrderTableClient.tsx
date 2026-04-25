"use client";

import React, { useState } from "react";
import { updateOrderStatus } from "@/server/actions/orderManagement";
import { OrderDetailsSheet } from "@/components/merchant/OrderDetailsSheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, FileText, CheckCircle, Truck, Package, XCircle, Clock } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface OrderTableProps {
  orders: any[]; // Expecting formatted orders from the server component
}

export function OrderTableClient({ orders }: OrderTableProps) {
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setIsUpdating(orderId);
    const result = await updateOrderStatus(orderId, newStatus);
    if (!result.success) {
      alert("Failed to update status: " + result.message);
    }
    setIsUpdating(null);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "DELIVERED": return "success";
      case "CANCELLED": return "destructive";
      case "PENDING": return "warning";
      case "PROCESSING":
      case "SHIPPED":
      default: return "info";
    }
  };

  if (orders.length === 0) {
    return (
      <div className="text-center py-20 bg-muted/20 rounded-xl border border-dashed">
        <Package className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
        <h3 className="text-lg font-medium">No orders found</h3>
        <p className="text-muted-foreground">You haven't received any B2B orders yet.</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-[120px]">Order ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead className="text-center">Total Items</TableHead>
              <TableHead className="text-right">Total Amount</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id} className="hover:bg-muted/10 transition-colors">
                <TableCell className="font-mono text-sm text-muted-foreground">
                  #{order.id.substring(0, 8)}
                </TableCell>
                <TableCell className="text-sm">
                  {new Date(order.createdAt).toLocaleDateString()}
                  <span className="block text-xs text-muted-foreground">
                    {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="font-medium text-foreground">{order.user.name || "N/A"}</div>
                  <div className="text-xs text-muted-foreground">{order.user.email}</div>
                </TableCell>
                <TableCell className="text-center">
                  <span className="inline-block px-2 py-1 bg-muted rounded-md text-xs font-mono">
                    {order.items.reduce((acc: number, item: any) => acc + item.quantity, 0)}
                  </span>
                </TableCell>
                <TableCell className="text-right font-bold text-primary">
                  ฿{order.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant={getStatusBadgeVariant(order.status)}>
                    {isUpdating === order.id ? "Updating..." : order.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0" disabled={isUpdating === order.id}>
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => setSelectedOrder(order)} className="cursor-pointer">
                        <FileText className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          <Clock className="mr-2 h-4 w-4" />
                          Update Status
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                          <DropdownMenuSubContent>
                            <DropdownMenuItem onClick={() => handleStatusChange(order.id, "PENDING")}>
                              Pending
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(order.id, "PROCESSING")}>
                              <Package className="mr-2 h-4 w-4 text-info" /> Processing
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(order.id, "SHIPPED")}>
                              <Truck className="mr-2 h-4 w-4 text-info" /> Shipped
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(order.id, "DELIVERED")}>
                              <CheckCircle className="mr-2 h-4 w-4 text-success" /> Delivered
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleStatusChange(order.id, "CANCELLED")} className="text-destructive focus:text-destructive">
                              <XCircle className="mr-2 h-4 w-4" /> Cancelled
                            </DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                      </DropdownMenuSub>

                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <OrderDetailsSheet 
        order={selectedOrder} 
        isOpen={!!selectedOrder} 
        onClose={() => setSelectedOrder(null)} 
      />
    </>
  );
}
