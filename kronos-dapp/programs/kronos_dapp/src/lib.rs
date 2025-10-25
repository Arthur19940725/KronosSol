use anchor_lang::prelude::*;

declare_id!("KronosDApp1111111111111111111111111111111111");

#[program]
pub mod kronos_dapp {
    use super::*;

    pub fn initialize_prediction(
        ctx: Context<InitializePrediction>,
        symbol: String,
        prediction_data: PredictionData,
    ) -> Result<()> {
        let prediction = &mut ctx.accounts.prediction;
        prediction.authority = ctx.accounts.authority.key();
        prediction.symbol = symbol;
        prediction.prediction_data = prediction_data;
        prediction.timestamp = Clock::get()?.unix_timestamp;
        Ok(())
    }

    pub fn update_prediction(
        ctx: Context<UpdatePrediction>,
        new_prediction_data: PredictionData,
    ) -> Result<()> {
        let prediction = &mut ctx.accounts.prediction;
        require!(
            prediction.authority == ctx.accounts.authority.key(),
            ErrorCode::Unauthorized
        );
        prediction.prediction_data = new_prediction_data;
        prediction.timestamp = Clock::get()?.unix_timestamp;
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(symbol: String)]
pub struct InitializePrediction<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 4 + symbol.len() + 8 + (32 * 10) + 8,
        seeds = [b"prediction", authority.key().as_ref(), symbol.as_bytes()],
        bump
    )]
    pub prediction: Account<'info, Prediction>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdatePrediction<'info> {
    #[account(
        mut,
        has_one = authority,
        seeds = [b"prediction", authority.key().as_ref(), prediction.symbol.as_bytes()],
        bump
    )]
    pub prediction: Account<'info, Prediction>,
    pub authority: Signer<'info>,
}

#[account]
pub struct Prediction {
    pub authority: Pubkey,
    pub symbol: String,
    pub prediction_data: PredictionData,
    pub timestamp: i64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct PredictionData {
    pub current_price: f64,
    pub predicted_prices: Vec<f64>,
    pub confidence: f64,
    pub prediction_days: u8,
    pub volatility: f64,
    pub trend: String,
}

#[error_code]
pub enum ErrorCode {
    #[msg("You are not authorized to perform this action.")]
    Unauthorized,
}
