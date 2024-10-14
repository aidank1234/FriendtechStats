const Web3 = require('web3');
const contractABI = require('./FriendtechSharesV1.json');

const providerUrl = process.env.PROVIDER_URL;
const contractAddress = process.env.CONTRACT_ADDRESS;

console.log('Provider URL:', providerUrl);
console.log('Contract Address:', contractAddress);

const web3 = new Web3(providerUrl);
const contract = new web3.eth.Contract(contractABI, contractAddress);

exports.handler = async (event) => {
    try {
        console.log('Received event:', JSON.stringify(event));

        const sharesSubject = event.queryStringParameters.address;
        console.log('Shares Subject Address:', sharesSubject);

        if (!web3.utils.isAddress(sharesSubject)) {
            console.error('Invalid address parameter:', sharesSubject);
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Invalid address parameter.' }),
            };
        }

        let totalSubjectFees = web3.utils.toBN(0);

        const latestBlock = await web3.eth.getBlockNumber();
        console.log('Latest Block Number:', latestBlock);

        // Calculate the approximate number of blocks in one month
        const averageBlockTime = 2; // in seconds
        const secondsInMonth = 14 * 24 * 60 * 60;
        const blocksInMonth = Math.floor(secondsInMonth / averageBlockTime);
        console.log('Approximate blocks in one month:', blocksInMonth);

        const startBlock = latestBlock - blocksInMonth;
        console.log('Start Block Number (approx. one month ago):', startBlock);

        const batchSize = 5000; // Adjust batch size as needed

        for (let fromBlock = startBlock; fromBlock <= latestBlock; fromBlock += batchSize) {
            const toBlock = Math.min(fromBlock + batchSize - 1, latestBlock);
            console.log(`Fetching events from block ${fromBlock} to ${toBlock}`);

            try {
                const events = await contract.getPastEvents('Trade', {
                    filter: { subject: sharesSubject },
                    fromBlock,
                    toBlock,
                });

                console.log(`Retrieved ${events.length} events from blocks ${fromBlock} to ${toBlock}`);

                events.forEach((event) => {
                    const subjectEthAmount = web3.utils.toBN(event.returnValues.subjectEthAmount);
                    totalSubjectFees = totalSubjectFees.add(subjectEthAmount);
                });
            } catch (batchError) {
                console.error(`Error fetching events from block ${fromBlock} to ${toBlock}:`, batchError);
            }
        }

        const totalFeesInEth = web3.utils.fromWei(totalSubjectFees, 'ether');
        console.log('Total Fees in ETH:', totalFeesInEth);

        return {
            statusCode: 200,
            body: JSON.stringify({ totalFeesInEth }),
        };
    } catch (error) {
        console.error('Error fetching data:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error.' }),
        };
    }
};