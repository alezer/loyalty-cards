import { Hono } from 'hono'
import { stampsRouter } from './stamps'
import { rewardsRouter } from './rewards'

export const router = new Hono()

router.route('/stamps',  stampsRouter)
router.route('/rewards', rewardsRouter)
