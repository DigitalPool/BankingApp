"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { PlaidLinkOnSuccess, PlaidLinkOptions, usePlaidLink } from "react-plaid-link";

import { Button } from "./ui/button";
import { completeReconnect, createReconnectLinkToken } from "@/lib/actions/user.actions";

type ReconnectBankButtonProps = {
  user: User;
  bankDocumentId: string;
  className?: string;
  label?: string;
};

const ReconnectBankButton = ({
  user,
  bankDocumentId,
  className,
  label = "Reconnect bank",
}: ReconnectBankButtonProps) => {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadReconnectToken = async () => {
      setIsLoading(true);
      const data = await createReconnectLinkToken({ user, bankDocumentId });
      setToken(data?.linkToken ?? "");
      setIsLoading(false);
    };

    loadReconnectToken();
  }, [user, bankDocumentId]);

  const onSuccess = useCallback<PlaidLinkOnSuccess>(
    async () => {
      setIsLoading(true);
      await completeReconnect({ bankDocumentId });
      router.refresh();
      setIsLoading(false);
    },
    [bankDocumentId, router]
  );

  const config: PlaidLinkOptions = {
    token,
    onSuccess,
  };

  const { open, ready } = usePlaidLink(config);

  return (
    <Button
      type="button"
      onClick={() => open()}
      disabled={!ready || isLoading || !token}
      className={className}
    >
      {isLoading ? (
        <>
          <Loader2 size={16} className="animate-spin" /> &nbsp; Reconnecting...
        </>
      ) : (
        label
      )}
    </Button>
  );
};

export default ReconnectBankButton;
