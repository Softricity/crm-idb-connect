import { GetServerSideProps } from 'next';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { ContractsAPI } from '@/lib/api';
import { Button, Card, CardBody, Input, Textarea } from '@heroui/react';
import { useMemo, useState } from 'react';

interface ContractRecord {
  id: string;
  title: string;
  content: string;
  status: 'PENDING' | 'SIGNED' | 'APPROVED' | 'REJECTED';
  signature_url?: string | null;
  rejection_note?: string | null;
}

interface ContractHubProps {
  contract: ContractRecord | null;
  token?: string;
}

export default function ContractHub({ contract, token }: ContractHubProps) {
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const stateLabel = useMemo(() => {
    if (!contract) return 'No contract assigned';
    if (contract.status === 'APPROVED') return 'Approved';
    if (contract.status === 'SIGNED') return 'Awaiting Admin Approval';
    if (contract.status === 'REJECTED') return 'Rejected';
    return 'Pending Signature';
  }, [contract]);

  const handleSign = async () => {
    if (!contract || !signatureFile) return;
    setLoading(true);
    try {
      const uploaded = await ContractsAPI.uploadSignature(contract.id, signatureFile, token);
      await ContractsAPI.sign(contract.id, uploaded.signature_url, token);
      window.location.reload();
    } catch (err: any) {
      alert(err?.message || 'Failed to sign contract');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!contract) return;
    try {
      const blob = await ContractsAPI.downloadPdf(contract.id, token);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contract-${contract.id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err?.message || 'Failed to download contract PDF');
    }
  };

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Contract Hub</h1>

        <Card>
          <CardBody className="space-y-4">
            <div className="text-sm text-gray-500">Status</div>
            <div className="text-lg font-semibold">{stateLabel}</div>
            {contract?.status === 'REJECTED' && contract.rejection_note ? (
              <div className="p-3 border rounded bg-red-50 text-red-700">
                Rejection Note: {contract.rejection_note}
              </div>
            ) : null}
          </CardBody>
        </Card>

        {!contract ? (
          <Card>
            <CardBody>No contract found. Please contact admin.</CardBody>
          </Card>
        ) : (
          <Card>
            <CardBody className="space-y-4">
              <h2 className="text-xl font-semibold">{contract.title}</h2>
              <Textarea
                value={contract.content}
                minRows={12}
                isReadOnly
              />

              {contract.signature_url ? (
                <div>
                  <div className="text-sm text-gray-500 mb-2">Current Signature</div>
                  <img src={contract.signature_url} alt="signature" className="max-h-28" />
                </div>
              ) : null}

              {(contract.status === 'PENDING' || contract.status === 'REJECTED') ? (
                <div className="flex gap-2 items-end">
                  <Input
                    type="file"
                    label="Upload Signature File"
                    accept="image/*,.pdf"
                    onChange={(e) => setSignatureFile(e.target.files?.[0] || null)}
                  />
                  <Button color="primary" onPress={handleSign} isLoading={loading} className="text-white">
                    Sign Contract
                  </Button>
                </div>
              ) : null}

              <div className="flex justify-end">
                <Button variant="flat" onPress={handleDownload}>Download PDF</Button>
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </ProtectedRoute>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { req } = ctx;
  const cookies = req.headers.cookie?.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = decodeURIComponent(value);
    return acc;
  }, {} as Record<string, string>);

  const token = cookies?.['auth-token'];
  if (!token) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  try {
    const contract = await ContractsAPI.getMyContract(token);
    return { props: { contract, token } };
  } catch {
    return { props: { contract: null, token } };
  }
};
