import { RequestNetwork, Types, Utils } from '@requestnetwork/request-client.js';
import { Web3SignatureProvider } from '@requestnetwork/web3-signature';
import { getProvider } from '@/utils/provider';

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).send({ error: 'Only POST requests are allowed' });
    }

    const { payer, amount, reason } = req.body;
    console.log("Request Body:",req.body);

    try {
        const provider = getProvider();
        const web3SignatureProvider = new Web3SignatureProvider(provider);

        const requestClient = new RequestNetwork({
            nodeConnectionConfig: { baseURL: 'https://sepolia.gateway.request.network/' },
            signatureProvider: web3SignatureProvider,
        });

        // const payeeIdentity = '0x7eB023BFbAeE228de6DC5B92D0BeEB1eDb1Fd567';
        const payeeIdentity = (await provider.getSigner().getAddress());
        // const payerIdentity = '0x519145B771a6e450461af89980e5C17Ff6Fd8A92';
        const payerIdentity = payer;
        const paymentRecipient = payeeIdentity;
        const feeRecipient = '0x0000000000000000000000000000000000000000';

        const requestCreateParameters = {
            requestInfo: {

                // The currency in which the request is denominated
                currency: {
                    type: Types.RequestLogic.CURRENCY.ERC20,
                    value: '0x370DE27fdb7D1Ff1e1BaA7D11c5820a324Cf623C',
                    network: 'sepolia',
                },

                // The expected amount as a string, in parsed units, respecting `decimals`
                // Consider using `parseUnits()` from ethers or viem
                expectedAmount: '1000000000000000000',

                // The payee identity. Not necessarily the same as the payment recipient.
                payee: {
                    type: Types.Identity.TYPE.ETHEREUM_ADDRESS,
                    value: payeeIdentity,
                },

                // The payer identity. If omitted, any identity can pay the request.
                payer: {
                    type: Types.Identity.TYPE.ETHEREUM_ADDRESS,
                    value: payerIdentity,
                },

                // The request creation timestamp.
                timestamp: Utils.getCurrentTimestampInSecond(),
            },

            // The paymentNetwork is the method of payment and related details.
            paymentNetwork: {
                id: Types.Extension.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT,
                parameters: {
                    paymentNetworkName: 'sepolia',
                    paymentAddress: payeeIdentity,
                    feeAddress: feeRecipient,
                    feeAmount: '0',
                },
            },

            // The contentData can contain anything.
            // Consider using rnf_invoice format from @requestnetwork/data-format
            contentData: {
                reason: '🍕'+ reason,
                dueDate: '2023.06.16',
            },

            // The identity that signs the request, either payee or payer identity.
            signer: {
                type: Types.Identity.TYPE.ETHEREUM_ADDRESS,
                value: payeeIdentity,
            },
        };

        const request = await requestClient.createRequest(requestCreateParameters as any);
        const confirmedRequestData = await request.waitForConfirmation();

        console.log("API LOG:", request, confirmedRequestData);

        return res.status(200).json(confirmedRequestData);
    } catch (error: any) {
        console.error(error);
        res.status(500).send({ error: error?.message });
    }
}
