export class AmortizationBuilder {
    static generate(
        newRemainingPrincipal: number,
        remainingTermMonths: number,
        interestRatePerMonth: number,
        baseDate: Date,
        paymentDay: number
    ): any[] {
        const scheduleRows = [];
        const principalPerMonth = newRemainingPrincipal / remainingTermMonths;
        const interestPerMonth = newRemainingPrincipal * interestRatePerMonth; 

        let currentRemaining = newRemainingPrincipal;
        let targetMonth = baseDate.getMonth() + 1; 
        let targetYear = baseDate.getFullYear();

        for (let i = 1; i <= remainingTermMonths; i++) {
            currentRemaining -= principalPerMonth;

            let dueDate = new Date(targetYear, targetMonth, paymentDay);
            if (dueDate.getMonth() !== (targetMonth % 12)) {
                dueDate = new Date(targetYear, targetMonth + 1, 0); 
            }

            scheduleRows.push({
                installment_number: i,
                due_date: `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}-${String(dueDate.getDate()).padStart(2, '0')}`,
                principal: principalPerMonth.toFixed(2),
                interest: interestPerMonth.toFixed(2),
                total_amount: (principalPerMonth + interestPerMonth).toFixed(2),
                remaining_balance: Math.max(0, currentRemaining).toFixed(2)
            });

            targetMonth++;
            if (targetMonth > 11) {
                targetMonth = 0;
                targetYear++;
            }
        }
        return scheduleRows;
    }
}