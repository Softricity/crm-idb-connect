"use client";

import { useState } from "react";
import {
  Button,
  Card,
  CardBody,
  Chip,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Tooltip,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/react";
import { EllipsisVertical, Edit, FileDown, Trash2 } from "lucide-react";
import {
  OfflinePayment,
  useOfflinePaymentStore,
} from "@/stores/useOfflinePaymentStore";
import { format } from "date-fns";

function StatusChip({ value }: { value?: string }) {
  const v = value || "Received";
  const color =
    v === "Received" ? "success" : v === "Pending" ? "warning" : "danger";
  return (
    <Chip color={color as any} variant="flat" className="font-medium">
      {v}
    </Chip>
  );
}

type Props = {
  onEdit: (p: any) => void;
};

export default function PaymentsTable({ onEdit }: Props) {
  const { payments, loading, deletePayment } = useOfflinePaymentStore();

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [targetPayment, setTargetPayment] = useState<OfflinePayment | null>(
    null
  );

  const handleDeletePayment = async () => {
    if (!targetPayment?.id) return;

    try {
      setDeletingId(targetPayment.id);
      await deletePayment(targetPayment.id, targetPayment.file);
    } catch (err) {
      console.error("❌ Error deleting payment:", err);
    } finally {
      setDeletingId(null);
      setIsDeleteModalOpen(false);
      setTargetPayment(null);
    }
  };

  return (
    <>
      <Card className="border border-default-200 shadow-sm">
        <CardBody>
          <div className="text-2xl font-semibold mb-2">Payments</div>

          {loading ? (
            <div className="flex items-center gap-2 py-10">
              <Spinner />
              <span className="text-default-500">Loading payments…</span>
            </div>
          ) : (
            <Table aria-label="Payments table" removeWrapper>
              <TableHeader>
                <TableColumn className="w-[180px]">Amount</TableColumn>
                <TableColumn>Payment Mode</TableColumn>
                <TableColumn className="w-[160px] text-center">Payment Status</TableColumn>
                <TableColumn>Payment Type</TableColumn>
                <TableColumn>Payment Stage</TableColumn>
                <TableColumn className="w-[240px]">
                  Received / Follow Up By Note
                </TableColumn>
                <TableColumn className="w-[80px] text-right">
                  Action
                </TableColumn>
              </TableHeader>

              <TableBody emptyContent="No payments yet">
                {payments.map((p: OfflinePayment) => (
                  <TableRow key={p.id} className="hover:bg-default-50">
                    <TableCell className="font-medium">
                      {p?.currency} {p?.amount}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{p.payment_mode || "Cash"}</span>
                        {p.file ? (
                          <Tooltip content="Download Uploaded File">
                            <a
                              href={p.file}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:opacity-80"
                            >
                              <FileDown className="h-4 w-4" />
                            </a>
                          </Tooltip>
                        ) : null}
                      </div>
                      {p.reference_id ? (
                        <div className="text-tiny text-default-500">
                          {p.reference_id}
                        </div>
                      ) : null}
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col justify-center items-center">
                        <StatusChip value={p.status} />
                        <div className="text-tiny text-default-500 mt-1">
                         {p.created_at ? format(new Date(p.created_at), "dd-MM-yyyy") : ""}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>{p.payment_type || "-"}</TableCell>
                    <TableCell>Payment Recorded</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <div>{p.partners?.name || "-"}</div>
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <Dropdown placement="bottom-end">
                        <DropdownTrigger>
                          <Button
                            isIconOnly
                            variant="light"
                            className="data-[hover=true]:bg-default-100"
                          >
                            <EllipsisVertical className="h-4 w-4" />
                          </Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="Row actions">
                          <DropdownItem
                            key="edit"
                            startContent={<Edit className="h-4 w-4" />}
                            onPress={() => onEdit(p)}
                          >
                            Edit
                          </DropdownItem>

                          <DropdownItem
                            key="delete"
                            className="text-danger"
                            color="danger"
                            startContent={<Trash2 className="h-4 w-4" />}
                            onPress={() => {
                              setTargetPayment(p);
                              setIsDeleteModalOpen(true);
                            }}
                          >
                            Delete
                          </DropdownItem>
                        </DropdownMenu>
                      </Dropdown>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* ✅ Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        placement="center"
        isDismissable={!deletingId}
      >
        <ModalContent>
          <ModalHeader className="font-semibold text-lg">
            Confirm Delete
          </ModalHeader>
          <ModalBody>
            <p className="text-default-600">
              Are you sure you want to delete this payment record? This action
              cannot be undone.
            </p>
            {targetPayment && (
              <div className="bg-default-100 p-3 rounded-md mt-2 text-sm">
                <strong>Amount:</strong> {targetPayment.currency}{" "}
                {targetPayment.amount}
                <br />
                <strong>Type:</strong> {targetPayment.payment_type}
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              variant="flat"
              onPress={() => setIsDeleteModalOpen(false)}
              isDisabled={!!deletingId}
            >
              Cancel
            </Button>
            <Button
              color="danger"
              isLoading={!!deletingId}
              onPress={handleDeletePayment}
            >
              {deletingId ? "Deleting…" : "Delete"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
